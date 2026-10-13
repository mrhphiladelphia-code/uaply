"""A stand-in for Google's sign-in, for testing UAply's "Continue with Google" without a Google account.

  python tools/mock-google.py [port]        (default 8790)
  GET  /mock/next?email=a@b.com&sub=123&verified=1   choose who "signs in" next
  GET  /auth?...                                      like accounts.google.com: immediately "approves" and redirects back
  POST /token                                         like oauth2.googleapis.com/token: checks code, secret and PKCE verifier

Point UAply at it with this in uaply-config.json:
  "google": {"client_id": "test.apps.googleusercontent.com", "client_secret": "test-secret",
             "auth_url": "http://127.0.0.1:8790/auth", "token_url": "http://127.0.0.1:8790/token"}
It is for local tests only and never talks to Google.
"""
import base64
import hashlib
import http.server
import json
import secrets
import sys
import time
import urllib.parse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
SECRET = "test-secret"
CLIENT = "test.apps.googleusercontent.com"
NEXT = {"email": "google.user@example.com", "sub": "1001", "verified": True}
CODES = {}


def b64(d):
    return base64.urlsafe_b64encode(d).rstrip(b"=").decode()


class H(http.server.BaseHTTPRequestHandler):
    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        q = {k: v[0] for k, v in urllib.parse.parse_qs(u.query).items()}
        if u.path == "/mock/next":
            NEXT.update({"email": q.get("email", NEXT["email"]), "sub": q.get("sub", NEXT["sub"]), "verified": q.get("verified", "1") == "1"})
            return self._json(200, NEXT)
        if u.path == "/auth":
            if q.get("client_id") != CLIENT or q.get("code_challenge_method") != "S256" or not q.get("redirect_uri"):
                return self._json(400, {"error": "bad request"})
            if q.get("deny"):
                return self._redirect(q["redirect_uri"] + "?error=access_denied&state=" + q.get("state", ""))
            code = secrets.token_urlsafe(16)
            CODES[code] = {"challenge": q["code_challenge"], "nonce": q.get("nonce"), "redirect": q["redirect_uri"], "who": dict(NEXT)}
            return self._redirect(q["redirect_uri"] + "?" + urllib.parse.urlencode({"code": code, "state": q.get("state", "")}))
        self._json(404, {"error": "not found"})

    def _redirect(self, where):
        self.send_response(302)
        self.send_header("Location", where)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        f = {k: v[0] for k, v in urllib.parse.parse_qs(self.rfile.read(n).decode()).items()}
        rec = CODES.pop(f.get("code", ""), None)          # a code works once
        if (self.path != "/token" or not rec or f.get("client_secret") != SECRET or f.get("client_id") != CLIENT
                or f.get("redirect_uri") != rec["redirect"] or f.get("grant_type") != "authorization_code"
                or b64(hashlib.sha256((f.get("code_verifier") or "").encode()).digest()) != rec["challenge"]):
            return self._json(400, {"error": "invalid_grant"})
        w = rec["who"]
        claims = {"iss": "https://accounts.google.com", "aud": CLIENT, "sub": w["sub"], "email": w["email"], "email_verified": w["verified"],
                  "nonce": rec["nonce"], "iat": int(time.time()), "exp": int(time.time()) + 3600}
        tok = b64(b'{"alg":"none"}') + "." + b64(json.dumps(claims).encode()) + "."
        self._json(200, {"access_token": "x", "id_token": tok, "token_type": "Bearer", "expires_in": 3600})

    def log_message(self, *a):
        pass


http.server.ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
