"""End-to-end test of forgot / reset / change password and the /setup page against a running sandbox server.
  python tools/test-reset.py [port]        (restart the server with `rm -rf data` first for a clean run)"""
import html
import http.cookiejar
import json
import re
import sys
import urllib.error
import urllib.request

PORT = sys.argv[1] if len(sys.argv) > 1 else "8766"
B = "http://127.0.0.1:%s" % PORT


def client():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def call(op, path, data=None, origin=True):
    h = {"Content-Type": "application/json"}
    if origin:
        h["Origin"] = B
    req = urllib.request.Request(B + path, data=json.dumps(data).encode() if data is not None else None, headers=h,
                                 method="POST" if data is not None else "GET")
    try:
        r = op.open(req)
        return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, None


def inbox_tokens():
    page = urllib.request.urlopen(B + "/outbox").read().decode("utf-8")
    return re.findall(r"\?reset=([A-Za-z0-9_-]{20,100})", html.unescape(page))


R = []


def t(name, got, want):
    ok = got == want
    R.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  -> got %r, wanted %r" % (got, want)))


a = client()
em, pw1, pw2 = "reset1@example.com", "first password 11", "second password 22"
t("signup", call(a, "/api/auth/signup", {"email": em, "password": pw1, "agree": True})[0], 200)
b = client()
call(b, "/api/auth/login", {"email": em, "password": pw1})
t("a second device is signed in", call(b, "/api/auth/me")[1]["user"]["email"], em)

s, body = call(client(), "/api/auth/forgot", {"email": em})
t("forgot answers ok", (s, body["ok"]), (200, True))
s2, body2 = call(client(), "/api/auth/forgot", {"email": "nobody@example.com"})
t("an unknown email gets the same answer", (s2, body2["message"]), (200, body["message"]))
t("forgot with a bad email is refused", call(client(), "/api/auth/forgot", {"email": "nope"})[0], 400)
toks = inbox_tokens()
t("exactly one reset link went to the test inbox", len(toks), 1)
tok = toks[0] if toks else "x" * 30

t("reset with a too-short password is refused", call(client(), "/api/auth/reset", {"token": tok, "password": "short"})[0], 400)
t("reset with a made-up token is refused", call(client(), "/api/auth/reset", {"token": "A" * 43, "password": pw2})[0], 400)
t("reset with the real link works", call(client(), "/api/auth/reset", {"token": tok, "password": pw2})[0], 200)
t("the same link cannot be used twice", call(client(), "/api/auth/reset", {"token": tok, "password": "third password 33"})[0], 400)
t("old password no longer works", call(client(), "/api/auth/login", {"email": em, "password": pw1})[0], 401)
c = client()
t("new password works", call(c, "/api/auth/login", {"email": em, "password": pw2})[0], 200)
t("other devices were signed out by the reset", call(b, "/api/auth/me")[1]["user"], None)

# change password while signed in
t("change with the wrong current password is refused", call(c, "/api/auth/change-password", {"current": "wrong wrong 1", "password": "fourth password 44"})[0], 401)
t("change with a short new password is refused", call(c, "/api/auth/change-password", {"current": pw2, "password": "x"})[0], 400)
d2 = client()
call(d2, "/api/auth/login", {"email": em, "password": pw2})
t("change password works", call(c, "/api/auth/change-password", {"current": pw2, "password": "fourth password 44"})[0], 200)
t("this device stays signed in", (call(c, "/api/auth/me")[1]["user"] or {}).get("email"), em)
t("the other device was signed out", call(d2, "/api/auth/me")[1]["user"], None)
t("login with the changed password", call(client(), "/api/auth/login", {"email": em, "password": "fourth password 44"})[0], 200)
t("change password while signed out is refused", call(client(), "/api/auth/change-password", {"current": "a", "password": "bbbbbbbbb"})[0], 401)

# rate limit: a 4th reset request for one email within the hour
for _ in range(3):
    s3 = call(client(), "/api/auth/forgot", {"email": em})[0]
t("a 4th reset request for one email is limited", s3, 429)

# the setup page
page = urllib.request.urlopen(B + "/setup").read().decode("utf-8")
t("setup page lists the three checks", all(k in page for k in ("Sign in with Google", "Email sending", "Copy of every application")), True)
t("setup page never prints a secret", "client_secret" not in page and "password\":" not in page, True)
s4, out = call(client(), "/api/setup/test-mail", {})
t("test mail says plainly that email is not set up yet (or sends)", s4 == 200 and "message" in out, True)

print(sum(R), "/", len(R))
sys.exit(0 if all(R) else 1)
