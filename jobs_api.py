"""Job ingestion back end for the sandbox and dev instances (not used by prod).

How real job apps get postings, and what this does:
  * Employers publish openings in an applicant tracking system (ATS). Greenhouse, Lever and Ashby expose public,
    read-only job-board APIs so third parties can list those openings. Aggregators keep a list of company board
    names, poll those endpoints, normalize the fields, de-duplicate, and link applicants back to the employer.
  * Indeed and ZipRecruiter do not offer an open API for reading their listings (partner programs only, and Indeed's
    terms forbid keeping copies), so they are NOT used here.
  * Remotive publishes a free remote-jobs feed on the condition that listings link back to Remotive and name it as
    the source, and that it is polled at most ~4 times a day. Both are respected below.

LEGAL STATUS OF EACH SOURCE (checked October 2026; this is not legal advice, have a lawyer confirm before launch):
  * Partner employers (uapply-partners.json): AUTHORIZED. The employer gave us the posting and agreed to receive
    applications. This is the only source whose applications UApply sends to a person.
  * Remotive: its terms call using listings "to collect signups or email addresses" a breach, and UApply collects
    emails. Never enabled by default; do not enable without written permission.
  * Jobicy: must credit Jobicy and send applicants to the original job URL, so it is LINK-OUT ONLY.
  * The Muse: terms not found. Unverified; do not enable until verified in writing.
  * Greenhouse, Lever, Ashby public boards: meant for employers' careers pages; no terms found that cover third-party
    aggregation. Unverified, LINK-OUT ONLY.
  Third-party feeds are OFF unless the owner lists them under "feeds" in uapply-config.json. Jobs from a feed are never
  emailed to anyone (the recruiter address is dropped); swiping right only opens the employer's own page.

get_jobs() returns {"fetched_at", "sources", "jobs"} where each job already matches the shape the app expects.
"""
import hashlib
import html
import json
import os
import re
import threading
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.abspath(__file__))
UA = "UApplyDev/0.1 (local prototype)"
DEFAULT_TTL = 30 * 60
TTL = {"remotive": 6 * 3600,          # Remotive allows roughly 4 requests a day
       "jobicy": 3600}                # Jobicy asks for at most one sync pass an hour
PER_SOURCE = 14

# (kind, board token, display name). Boards are the employer's own public careers feed.
SOURCES = [
    ("greenhouse", "discord", "Discord"),
    ("greenhouse", "dropbox", "Dropbox"),
    ("greenhouse", "duolingo", "Duolingo"),
    ("greenhouse", "squarespace", "Squarespace"),
    ("greenhouse", "webflow", "Webflow"),
    ("lever", "spotify", "Spotify"),
    ("ashby", "linear", "Linear"),
    ("remotive", "software-dev", "Remotive"),
    ("jobicy", "engineering", "Jobicy"),      # credit Jobicy and link to its canonical job URL
    ("jobicy", "marketing", "Jobicy"),
    ("jobicy", "data-science", "Jobicy"),
    ("muse", "Internship", "The Muse"),       # The Muse public jobs API; links go to the posting on The Muse
    ("muse", "Entry Level", "The Muse"),
]
MULTI = ("jobicy", "muse")                    # several feeds share one display name

SKILLS = [
    ("JavaScript", r"javascript|\bjs\b"), ("TypeScript", r"typescript"), ("React", r"\breact(?:\.js|js)?\b"),
    ("Node", r"\bnode(?:\.js|js)?\b"), ("Python", r"\bpython\b"), ("Java", r"\bjava\b"), ("SQL", r"\bsql\b"),
    ("PostgreSQL", r"postgres(?:ql)?"), ("AWS", r"\baws\b|amazon web services"), ("Docker", r"\bdocker\b"),
    ("Kubernetes", r"kubernetes|\bk8s\b"), ("Terraform", r"terraform"), ("Figma", r"\bfigma\b"),
    ("Excel", r"\bexcel\b"), ("Tableau", r"\btableau\b"), ("Django", r"\bdjango\b"), ("CSS", r"\bcss\b"),
    ("HTML", r"\bhtml\b"), ("Testing", r"\btesting\b|unit tests?|test automation"), ("SEO", r"\bseo\b"),
    ("Copywriting", r"copywrit"), ("Analytics", r"\banalytics\b"), ("Hiring", r"recruit(?:ing|er|ment)\b"),
    ("User research", r"user research"), ("Prototyping", r"prototyp"), ("Design systems", r"design systems?"),
    ("Roadmapping", r"roadmap"), ("Budgeting", r"\bbudget"), ("PyTorch", r"pytorch"),
]
SKILL_RES = [(n, re.compile(p, re.I)) for n, p in SKILLS]

STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split()
US_RE = re.compile(r"United States|\bUSA\b|\bU\.S\.|\bUS\b|, (?:%s)\b|\b(?:San Francisco|New York|Seattle|Austin|Boston|Chicago|Denver|Los Angeles|Atlanta|Portland)\b" % "|".join(STATES))
FOREIGN_RE = re.compile(r"Germany|United Kingdom|\bUK\b|India|Canada|Ireland|France|Spain|Brazil|Mexico|Poland|Netherlands|Japan|Australia|Singapore|EMEA|APAC|Europe|LATAM|Berlin|London|Dublin|Toronto|Sydney|Amsterdam|Lisbon|Paris", re.I)
SAL_RE = re.compile(r"\$\s?(\d{2,3}(?:,\d{3})+|\d{2,3}\s?[kK])\s*(?:-|–|—|to)\s*\$?\s*(\d{2,3}(?:,\d{3})+|\d{2,3}\s?[kK])")
YRS_RE = re.compile(r"(\d{1,2})\+?\s*(?:or more\s*)?(?:years|yrs)", re.I)

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
RECRUITING_RE = re.compile(r"career|jobs|recruit|talent|hiring|apply|people@|hr@", re.I)
NOT_CONTACT_RE = re.compile(r"scam|fraud|phish|abuse|security|privacy|legal|compliance|no-?reply|donotreply|\.(png|jpg|gif)$", re.I)

_cache = {}
_lock = threading.Lock()


def _contact(text):
    """A recruiting address printed in the posting, if there is one. Only recruiting-looking mailboxes qualify."""
    for m in EMAIL_RE.findall(text or ""):
        if RECRUITING_RE.search(m.split("@")[0]) and not NOT_CONTACT_RE.search(m):
            return m
    return ""


def _get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def _text(s):
    s = html.unescape(s or "")
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()[:20000]


def _money(tok):
    tok = tok.replace(",", "").replace(" ", "")
    return int(tok[:-1]) * 1000 if tok[-1] in "kK" else int(tok)


def _salary(*texts):
    for t in texts:
        m = SAL_RE.search(t or "")
        if m:
            lo, hi = _money(m.group(1)), _money(m.group(2))
            if 20000 <= lo < hi <= 600000:
                return [lo, hi]
    return [0, 0]


def _fetch_raw(kind, token, name):
    """Return a list of raw postings: dicts with id, title, company, loc, remote, text, url, salary_text."""
    out = []
    if kind == "greenhouse":
        for j in _get("https://boards-api.greenhouse.io/v1/boards/%s/jobs?content=true" % token).get("jobs", []):
            out.append(dict(id=j["id"], title=j["title"], company=j.get("company_name") or name,
                            loc=(j.get("location") or {}).get("name", ""), remote=None,
                            text=_text(j.get("content")), url=j["absolute_url"], salary_text=""))
    elif kind == "lever":
        for j in _get("https://api.lever.co/v0/postings/%s?mode=json" % token):
            cat = j.get("categories") or {}
            out.append(dict(id=j["id"], title=j["text"], company=name, loc=cat.get("location", "") or "",
                            remote=(j.get("workplaceType") == "remote") or None,
                            text=_text((j.get("descriptionPlain") or "") + " " + (j.get("additionalPlain") or "")),
                            url=j["hostedUrl"], salary_text=""))
    elif kind == "ashby":
        for j in _get("https://api.ashbyhq.com/posting-api/job-board/%s" % token).get("jobs", []):
            if j.get("isListed") is False:
                continue
            out.append(dict(id=j["id"], title=j["title"], company=name, loc=j.get("location", "") or "",
                            remote=bool(j.get("isRemote")) or j.get("workplaceType") == "Remote" or None,
                            text=_text(j.get("descriptionPlain") or j.get("descriptionHtml")),
                            url=j["jobUrl"], salary_text=""))
    elif kind == "remotive":
        for j in _get("https://remotive.com/api/remote-jobs?category=%s&limit=60" % token).get("jobs", []):
            loc = j.get("candidate_required_location") or ""
            if not re.search(r"usa|united states|worldwide|americas|north america|anywhere", loc, re.I):
                continue
            out.append(dict(id=j["id"], title=j["title"], company=j["company_name"], loc="Remote (%s)" % loc, remote=True,
                            text=_text(j.get("description")) + " " + " ".join(j.get("tags") or []),
                            url=j["url"], salary_text=j.get("salary") or ""))
    elif kind == "jobicy":
        data = _get("https://jobicy.com/api/v2/remote-jobs?count=30&geo=usa&industry=%s" % token)
        for j in data.get("jobs", []):
            sal = None
            lo, hi = j.get("salaryMin"), j.get("salaryMax")
            if j.get("salaryPeriod") == "yearly" and j.get("salaryCurrency") == "USD" and isinstance(lo, (int, float)) \
                    and isinstance(hi, (int, float)) and 20000 <= lo < hi <= 600000:
                sal = [int(lo), int(hi)]
            out.append(dict(id=j["id"], title=j["jobTitle"], company=j["companyName"],
                            loc="Remote (%s)" % re.sub(r"\s+", " ", j.get("jobGeo") or "USA").strip(), remote=True,
                            text=_text(j.get("jobDescription")), url=j["url"], salary_text="", sal=sal,
                            fallback=(j.get("jobIndustry") or [None])[0]))
    elif kind == "muse":
        for page in (1, 2):
            data = _get("https://www.themuse.com/api/public/jobs?page=%d&level=%s" % (page, urllib.parse.quote(token)))
            for j in data.get("results", []):
                locs = [l.get("name", "") for l in j.get("locations", [])]
                loc = ", ".join(locs[:2]) + (" +%d more" % (len(locs) - 2) if len(locs) > 2 else "")
                cats = [c.get("name") for c in j.get("categories", []) if c.get("name")]
                out.append(dict(id=j["id"], title=j["name"], company=j["company"]["name"], loc=loc or "Not listed",
                                remote=any(re.search("remote|flexible", l, re.I) for l in locs) or None,
                                text=_text(j.get("contents")), url=j["refs"]["landing_page"], salary_text="",
                                fallback=cats[0] if cats else None,
                                force_type="internship" if token == "Internship" else None))
    return out


def _normalize(raw, kind, name):
    title, loc, text = raw["title"], raw["loc"], raw["text"]
    remote = raw["remote"] if raw["remote"] is not None else bool(re.search(r"\bremote\b", loc, re.I))
    if not (US_RE.search(loc) or (remote and not FOREIGN_RE.search(loc))):
        return None
    if not raw["url"].startswith("https://"):
        return None
    hay = (title + " ") * 2 + text
    found = []
    for skill, rx in SKILL_RES:
        n = len(rx.findall(hay))
        if n:
            found.append((n, skill))
    if found:
        skills = [s for _, s in sorted(found, key=lambda x: -x[0])[:4]]
    elif raw.get("fallback"):
        skills = [raw["fallback"]]      # no known skill in the text: score on the posting's own category
    else:
        return None
    mode = "remote" if remote else ("hybrid" if re.search(r"hybrid", loc + " " + text[:600], re.I) else "onsite")
    t = title.lower()
    typ = raw.get("force_type") or ("internship" if re.search(r"\bintern(ship)?\b", t) else ("coop" if re.search(r"co-?op\b", t) else "job"))
    m = YRS_RE.search(text)
    yrs = min(int(m.group(1)), 15) if m else 0
    edu = "Bachelor" if re.search(r"bachelor|\bB\.?S\.? degree", text, re.I) else "High school"
    blurb = text[:170].rsplit(" ", 1)[0] + "…" if len(text) > 170 else text
    jid = 100000 + int(hashlib.sha1(("%s:%s" % (kind, raw["id"])).encode()).hexdigest()[:6], 16)
    src = name if kind in ("remotive", "jobicy", "muse") else "%s's careers page" % raw["company"]
    # contact is deliberately empty and apply is "link": a third-party feed never gets an application emailed to anyone
    return dict(id=jid, co=raw["company"], role=title, loc=loc or "Not listed", mode=mode,
                sal=raw.get("sal") or _salary(raw["salary_text"], text), yrs=yrs, edu=edu, skills=skills, blurb=blurb,
                type=typ, url=raw["url"], source=src, contact="", apply="link", live=True)


_refreshing = set()


def known_contact(job_id):
    """The recruiter address this server itself holds for a job ('' if none or unknown). Only partner employers have one."""
    for j in partner_jobs():
        if j["id"] == job_id:
            return j.get("contact", "") or ""
    with _lock:
        for c in _cache.values():
            for j in c["jobs"]:
                if j["id"] == job_id:
                    return j.get("contact", "") or ""
    return ""


def _refresh_in_background(src):
    try:
        _fetch_source(src)
    finally:
        with _lock:
            _refreshing.discard(src)


def _load_source(src):
    """Serve what is cached right away, even if stale, and refresh it in the background.
    Only the very first request for a source waits for the network."""
    ttl = TTL.get(src[0], DEFAULT_TTL)
    with _lock:
        c = _cache.get(src)
        if c and time.time() - c["at"] >= ttl and src not in _refreshing:
            _refreshing.add(src)
            threading.Thread(target=_refresh_in_background, args=(src,), daemon=True).start()
    if c:
        return c["jobs"], c["status"]
    return _fetch_source(src)


def _fetch_source(src):
    kind, token, name = src
    ttl = TTL.get(kind, DEFAULT_TTL)
    try:
        jobs = []
        for raw in _fetch_raw(kind, token, name):
            j = _normalize(raw, kind, name)
            if j:
                jobs.append(j)
            if len(jobs) >= PER_SOURCE:
                break
        status = "%d jobs" % len(jobs)
    except Exception as e:                      # keep serving the last good copy if the feed is down
        c = _cache.get(src)
        jobs = c["jobs"] if c else []
        status = "error: %s" % str(e)[:80]
        with _lock:
            if c:
                c["at"] = time.time() - ttl + 120   # retry in two minutes
        return jobs, status
    with _lock:
        _cache[src] = {"at": time.time(), "jobs": jobs, "status": status}
    return jobs, status


def _cfg():
    try:
        with open(os.path.join(ROOT, "uapply-config.json"), encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def feeds_allowed():
    """Third-party feeds the owner has explicitly switched on (default: none). See the legal notes at the top."""
    f = _cfg().get("feeds")
    return {x for x in f if isinstance(x, str)} if isinstance(f, list) else set()


# ---- partner employers: postings an employer gave us and who agreed to receive applications ----
_partners = {"path": None, "mtime": None, "jobs": []}


def _clean(v, n):
    return re.sub(r"\s+", " ", v).strip()[:n] if isinstance(v, str) else ""


def partner_jobs():
    """Jobs from uapply-partners.json (or the placeholder-only partners.example.json). Each employer must record how it
    consented. An employer with a contact address receives applications directly; without one it is link-out only."""
    path = next((os.path.join(ROOT, n) for n in ("uapply-partners.json", "partners.example.json")
                 if os.path.exists(os.path.join(ROOT, n))), None)
    if not path:
        return []
    try:
        mtime = os.path.getmtime(path)
        if _partners["path"] == path and _partners["mtime"] == mtime:
            return _partners["jobs"]
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return _partners["jobs"]
    out = []
    for e in data.get("employers", []) if isinstance(data, dict) else []:
        name, consent = _clean(e.get("name"), 100), _clean(e.get("consent"), 300)
        if not name or not consent:
            continue                                   # no recorded consent, no listing
        contact = _clean(e.get("contact"), 120)
        contact = contact if re.match(r"^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$", contact) else ""
        for j in e.get("jobs", []):
            role, skills = _clean(j.get("role"), 120), [_clean(s, 40) for s in (j.get("skills") or [])[:6] if _clean(s, 40)]
            if not role or not skills:
                continue
            url = _clean(j.get("url") or e.get("url"), 400)
            sal = j.get("sal") if isinstance(j.get("sal"), list) and len(j["sal"]) == 2 else [0, 0]
            try:
                sal = [max(0, int(sal[0])), max(0, int(sal[1]))]
            except (TypeError, ValueError):
                sal = [0, 0]
            out.append(dict(
                id=200000 + int(hashlib.sha1(("partner:%s:%s" % (name, role)).encode()).hexdigest()[:6], 16),
                co=name, role=role, loc=_clean(j.get("loc"), 80) or "Not listed",
                mode=j.get("mode") if j.get("mode") in ("remote", "hybrid", "onsite") else "remote", sal=sal,
                yrs=min(15, max(0, int(j.get("yrs") or 0))) if str(j.get("yrs") or 0).isdigit() else 0,
                edu=j.get("edu") if j.get("edu") in ("High school", "Associate", "Bachelor", "Master", "Doctorate") else "High school",
                skills=skills, blurb=_clean(j.get("blurb"), 220),
                type=j.get("type") if j.get("type") in ("job", "internship", "coop") else "job",
                url=url if url.startswith("https://") else "", source="Direct from %s (partner employer)" % name,
                contact=contact, apply="direct" if contact else "link", partner=True, live=True))
    _partners.update(path=path, mtime=mtime, jobs=out)
    return out


def job_policy(job_id):
    """How an application to this job may be handled: 'direct' (the employer opted in), 'link' (send the person to the
    employer's own page; nothing is emailed) or 'unknown' (an example listing)."""
    for j in partner_jobs():
        if j["id"] == job_id:
            return j["apply"]
    with _lock:
        for c in _cache.values():
            if any(j["id"] == job_id for j in c["jobs"]):
                return "link"
    return "unknown"


def get_jobs():
    allowed = feeds_allowed()
    sources = [s for s in SOURCES if s[0] in allowed]
    with ThreadPoolExecutor(max_workers=8) as ex:
        results = list(ex.map(_load_source, sources))
    jobs, seen, summary = [], set(), {}
    for pj in partner_jobs():
        seen.add(pj["id"])
        jobs.append(pj)
    summary["Partner employers"] = "%d jobs" % len(jobs)
    for src, (js, status) in zip(sources, results):
        summary[src[2] + ("/" + src[1] if src[0] in MULTI else "")] = status
        for j in js:
            if j["id"] not in seen:
                seen.add(j["id"])
                jobs.append(j)
    if not sources:
        summary["Third-party feeds"] = "off (not verified as permitted)"
    return {"fetched_at": int(time.time()), "sources": summary, "jobs": jobs}


def get_json():
    return json.dumps(get_jobs()).encode("utf-8")
