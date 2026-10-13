module.exports = async ({ ev, sleep, nav, shot }) => {
  const F = "document.querySelector('iframe').contentDocument";
  await nav("http://127.0.0.1:8766/");
  await sleep(1200);
  await ev(F + ".getElementById('nb-prof').click()"); await sleep(400);
  await ev("[...(" + F + ").querySelectorAll('button')].find(b=>b.innerText.trim().startsWith('Data')).click()"); await sleep(500);
  await ev("(()=>{const h=[...(" + F + ").querySelectorAll('h3')].find(x=>x.innerText.trim().toLowerCase()==='legal');h.scrollIntoView({block:'start'});return !!h})()");
  await sleep(500);
  await shot(require("path").join(require("os").tmpdir(), "legal-block.png"));
};
