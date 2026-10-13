// Walks forgot password -> email link -> new password -> log in -> change password through the real screens.
// node tools/cdp.js tools/ui-reset.js     (sandbox on 8766, ideally with a clean data folder)
const PORT = process.env.PORT || "8766";
module.exports = async ({ ev, sleep, nav, shot }) => {
  const F = "document.querySelector('iframe').contentDocument";
  const BASE = "http://127.0.0.1:" + PORT;
  let bad = 0;
  const check = (name, ok, extra) => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (extra ? "  " + extra : "")); };
  const byAuth = (a) => F + ".querySelector('[data-auth=\"" + a + "\"]')";
  const click = (a) => ev("(()=>{const e=" + byAuth(a) + ";if(!e)return false;e.click();return true})()");
  const setVal = (id, v) => ev("(()=>{const e=" + F + ".getElementById('" + id + "');if(!e)return false;e.value=" + JSON.stringify(v) + ";return true})()");
  const note = () => ev(F + ".getElementById('aMsg')?" + F + ".getElementById('aMsg').innerText:''");
  const accountText = () => ev("(" + F + ").body.innerText.split(String.fromCharCode(10)).join(' ')");
  const openAccount = async () => {
    await ev(F + ".getElementById('nb-prof').click()"); await sleep(400);
    await ev("[...(" + F + ").querySelectorAll('button')].find(b=>b.innerText.trim().startsWith('Account')).click()"); await sleep(500);
  };
  const email = "ui.reset." + Date.now() + "@example.com";

  await nav(BASE + "/");
  await sleep(1200);
  // make an account through the API, then sign out, so the UI starts at the log-in screen
  console.log("signup via API:", await ev("fetch('/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'" + email + "',password:'old password 11',agree:true})}).then(r=>r.status)"));
  console.log("logout via API:", await ev("fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.status)"));
  await nav(BASE + "/");
  await sleep(1200);
  await openAccount();
  check("create-account form shows first", !!(await ev("!!" + F + ".getElementById('sAgree')")));
  check("switch to log in", await click("smode")); await sleep(300);
  check("Forgot password? button is on the log-in screen", !!(await ev("!!" + byAuth("sforgot"))));
  check("open Forgot password", await click("sforgot")); await sleep(300);
  check("reset form asks for the email", !!(await ev("!!" + F + ".getElementById('sFEmail')")));
  await click("sforgotgo"); await sleep(300);
  check("empty email is refused with a message", (await note()).toLowerCase().includes("valid email"), await note());
  await setVal("sFEmail", email);
  await click("sforgotgo"); await sleep(1200);
  check("shows Check your email", (await accountText()).includes("Check your email"));
  check("test mode points to the test inbox", (await accountText()).includes("test inbox"));
  const tok = await ev("fetch('/outbox').then(r=>r.text()).then(t=>{const d=document.createElement('textarea');d.innerHTML=t;const m=d.value.match(/[?]reset=([A-Za-z0-9_-]{20,100})/);return m?m[1]:''})");
  check("a reset link is in the test inbox", tok.length > 20);

  // follow the link from the email
  await nav(BASE + "/?reset=" + tok);
  await sleep(1800);
  check("link opens the new-password form", !!(await ev("!!" + F + ".getElementById('sRPw')")));
  await setVal("sRPw", "short"); await setVal("sRPw2", "short");
  await click("sresetgo"); await sleep(300);
  check("a short password is refused", (await note()).includes("8 characters"), await note());
  await setVal("sRPw", "brand new pass 22"); await setVal("sRPw2", "different pass 33");
  await click("sresetgo"); await sleep(300);
  check("mismatched passwords are refused", (await note()).includes("do not match"), await note());
  await setVal("sRPw2", "brand new pass 22");
  await click("sresetgo"); await sleep(1500);
  check("success message and log-in screen", (await note()).includes("Password changed") && !!(await ev("!!" + byAuth("sforgot"))), await note());
  check("the address bar no longer holds the token", !(await ev("location.href")).includes("reset="));

  // log in with the new password
  await setVal("sEmail", email); await setVal("sPw", "brand new pass 22");
  await click("ssubmit"); await sleep(1500);
  check("log in with the new password", (await accountText()).includes("You are signed in") && (await accountText()).includes(email), await note());
  await shot(require("path").join(require("os").tmpdir(), "ui-signed-in.png"));

  // change password
  check("Change password button shows", !!(await ev("!!" + byAuth("schg"))));
  await click("schg"); await sleep(300);
  await setVal("sCur", "wrong password 9"); await setVal("sNew", "changed again 44"); await setVal("sNew2", "changed again 44");
  await click("schgo"); await sleep(1200);
  check("wrong current password is refused", (await note()).includes("current password"), await note());
  await setVal("sCur", "brand new pass 22"); await setVal("sNew", "changed again 44"); await setVal("sNew2", "changed again 44");
  await click("schgo"); await sleep(3500);
  check("password changed", (await note()).includes("Password changed"), await note());
  check("still signed in", (await accountText()).includes("You are signed in"));
  console.log(bad ? "\n" + bad + " check(s) failed" : "\nAll reset-flow checks passed");
};
