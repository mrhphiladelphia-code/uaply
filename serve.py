"""Tiny static server: python serve.py PORT ROOT [--api] [urlpath=file ...]
Serves ROOT; each urlpath=file alias maps one URL to a file outside ROOT (e.g. /prod-index.html to prod/index.html).
--api also exposes the back end used by sandbox and dev (prod does not):
  GET  /api/jobs          real postings (jobs_api.py)
  GET  /api/apply/config  delivery mode
  POST /api/apply         swipe right: deliver an application (uaply_api.py)
  POST /api/decision      swipe left or right: record the swipe
  GET  /outbox            simulated recruiter inbox + swipe stats   (/api/outbox for JSON)
  GET  /api/auth/me       the signed-in account, or null (auth_api.py)
  POST /api/auth/signup   create an account (email + password) and sign in
  POST /api/auth/login    sign in
  POST /api/auth/logout   sign out
  POST /api/auth/delete   delete the signed-in account (password required) and forget its application records
  GET  /api/chat/config   whether the assistant's AI answers are on (chat_api.py)
  POST /api/chat          UAply Assistant: answer a support question from the help articles
  POST /api/feedback      store feedback sent through the assistant
  GET  /feedback          the feedback summary page (this server only listens on this computer)
  GET  /help/articles.json  the help articles the assistant answers from
Accounts use an HttpOnly session cookie. When a signed-in user swipes right, a receipt goes to their email."""
import sys, os, json, http.server, http.cookies

port = int(sys.argv[1])
root = os.path.abspath(sys.argv[2])
rest = sys.argv[3:]
api = "--api" in rest
alias = {}
for a in rest:
    if a == "--api":
        continue
    u, f = a.split("=", 1)
    alias[u] = os.path.abspath(f)

HERE = os.path.dirname(os.path.abspath(__file__))
if api:
    # the sandbox and dev pages load these shared files and a copy of the production page; no command-line aliases needed
    for url, rel in (("/uaply-envs.js", "shared/uaply-envs.js"), ("/uaply-nav.js", "shared/uaply-nav.js"),
                     ("/uaply-live.js", "shared/uaply-live.js"), ("/uaply-profile.js", "shared/uaply-profile.js"),
                     ("/uaply-chat.js", "shared/uaply-chat.js"), ("/help/articles.json", "help/articles.json"),
                     ("/prod-index.html", "prod/index.html")):
        alias.setdefault(url, os.path.join(HERE, rel))
    import jobs_api, uaply_api, auth_api, chat_api
    uaply_api.init(os.path.basename(root))
    auth_api.init(os.path.basename(root))
    chat_api.init(os.path.basename(root))
    import threading
    threading.Thread(target=jobs_api.get_jobs, daemon=True).start()   # warm the job cache so the first visitor does not wait

MAX_BODY = 40000

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=root, **k)

    def translate_path(self, path):
        p = path.split("?", 1)[0].split("#", 1)[0]
        if api and p.startswith("/legal/") and ".." not in p:           # Terms, Privacy, AI disclosure, Copyright
            return os.path.join(HERE, "legal", p[len("/legal/"):] or "index.html")
        return alias.get(p) or super().translate_path(path)

    def _send(self, code, body, ctype="application/json", headers=()):
        if not isinstance(body, bytes):
            body = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        for k, v in headers:
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _token(self):
        """The session token from this instance's cookie ('' if there is none)."""
        try:
            jar = http.cookies.SimpleCookie(self.headers.get("Cookie") or "")
            return jar[auth_api.cookie_name()].value if auth_api.cookie_name() in jar else ""
        except Exception:
            return ""

    def _cookie(self, token):
        secure = "; Secure" if (self.headers.get("X-Forwarded-Proto") == "https") else ""
        age = auth_api.SESSION_SECONDS if token else 0
        return [("Set-Cookie", "%s=%s; HttpOnly; SameSite=Lax; Path=/; Max-Age=%d%s" % (auth_api.cookie_name(), token, age, secure))]

    def do_GET(self):
        p = self.path.split("?", 1)[0]
        if api:
            try:
                if p == "/api/jobs":
                    return self._send(200, jobs_api.get_json())
                if p == "/api/apply/config":
                    return self._send(200, uaply_api.public_config())
                if p == "/api/outbox":
                    return self._send(200, uaply_api.outbox_json())
                if p == "/outbox":
                    return self._send(200, uaply_api.outbox_html(), "text/html; charset=utf-8")
                if p == "/api/auth/me":
                    return self._send(200, {"user": auth_api.user_for(self._token())})
                if p == "/api/chat/config":
                    return self._send(200, chat_api.public_config())
                if p == "/feedback":
                    return self._send(200, chat_api.feedback_html(), "text/html; charset=utf-8")
            except Exception as e:
                return self._send(502, {"error": str(e)[:100]})
        super().do_GET()

    def do_POST(self):
        p = self.path.split("?", 1)[0]
        if not api or p not in ("/api/apply", "/api/decision", "/api/auth/signup", "/api/auth/login", "/api/auth/logout",
                                "/api/auth/delete", "/api/chat", "/api/feedback"):
            return self._send(404, {"error": "not found"})
        # Only accept requests made by this site's own pages (blocks cross-site forms and scripts).
        origin = self.headers.get("Origin")
        if origin != "http://" + (self.headers.get("Host") or ""):
            return self._send(403, {"error": "cross-site request refused"})
        try:
            n = int(self.headers.get("Content-Length") or 0)
            if n <= 0 or n > MAX_BODY:
                return self._send(413, {"error": "bad size"})
            payload = json.loads(self.rfile.read(n).decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("not an object")
        except Exception:
            return self._send(400, {"error": "bad request"})
        ip = self.client_address[0]
        try:
            if p == "/api/auth/signup":
                code, out, token = auth_api.signup(payload.get("email"), payload.get("password"), ip, payload.get("agree"))
                return self._send(code, out, headers=self._cookie(token) if token else ())
            if p == "/api/auth/login":
                code, out, token = auth_api.login(payload.get("email"), payload.get("password"), ip)
                return self._send(code, out, headers=self._cookie(token) if token else ())
            if p == "/api/auth/logout":
                auth_api.logout(self._token())
                return self._send(200, {"ok": True}, headers=self._cookie(""))
            if p == "/api/auth/delete":
                code, out, uid = auth_api.delete_account(self._token(), payload.get("password"), ip)
                if uid:
                    out["applicationsRemoved"] = uaply_api.forget_user(uid)
                    chat_api.forget_user(uid)
                    return self._send(code, out, headers=self._cookie(""))
                return self._send(code, out)
            if p == "/api/chat":
                code, out = chat_api.chat(payload, ip)
            elif p == "/api/feedback":
                code, out = chat_api.feedback(payload, ip, auth_api.user_for(self._token()))
            elif p == "/api/apply":
                code, out = uaply_api.submit(payload, auth_api.user_for(self._token()))
            else:
                code, out = uaply_api.record_decision(payload)
        except Exception as e:
            code, out = 500, {"error": "server error: " + str(e)[:100]}
        self._send(code, out)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

http.server.ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
