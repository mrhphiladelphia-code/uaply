// UI check against a server on 8768 that has Google switched on (see tools/test-google.py).
module.exports = async ({ ev, sleep, nav, shot }) => {
  const F = "document.querySelector('iframe').contentDocument";
  const click = (sel) => ev("(()=>{const e=" + F + ".querySelector(" + JSON.stringify(sel) + ");if(!e)return 'missing';e.click();return 'ok'})()");
  const clickText = (txt) => ev("(()=>{const e=[...(" + F + ").querySelectorAll('button,a,[role=tab]')].find(b=>b.innerText.replace(/\\s+/g,' ').trim().startsWith(" + JSON.stringify(txt) + "));if(!e)return 'missing';e.click();return 'ok'})()");
  await nav("http://127.0.0.1:8768/");
  await sleep(1500);
  console.log("open Profile:", await click("#nb-prof"));
  await sleep(500);
  console.log("subnav items:", await ev("[...(" + F + ").querySelectorAll('#subnav button, .subnav button, nav button')].map(b=>b.innerText.trim().split('\\n')[0]).join(' | ')"));
  console.log("click Data & privacy:", await clickText("Data"));
  await sleep(600);
  console.log("legal links:", await ev("[...(" + F + ").querySelectorAll('[data-legal]')].map(a=>a.getAttribute('data-legal')+'='+a.getAttribute('href')).join(' ')"));
  const hrefs = JSON.parse(await ev("JSON.stringify([...(" + F + ").querySelectorAll('[data-legal]')].map(a=>a.href))"));
  for (const h of hrefs) {
    const r = await ev("fetch(" + JSON.stringify(h) + ").then(r=>r.status)");
    console.log("  ", h, "->", r);
  }
  await shot(require("path").join(require("os").tmpdir(), "ui-data-privacy.png"));
  console.log("click Account:", await clickText("Account"));
  await sleep(800);
  console.log("google button present:", await ev("!!" + F + ".querySelector('[data-auth=gsign]')"));
  console.log("agree box present:", await ev("!!" + F + ".querySelector('#gAgree')"));
  await shot(require("path").join(require("os").tmpdir(), "ui-account-google.png"));
};
