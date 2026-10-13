module.exports = async ({ ev, sleep, nav, shot }) => {
  const F = "document.querySelector('iframe').contentDocument";
  await nav("http://127.0.0.1:8766/");
  await sleep(1500);
  await ev(F + ".getElementById('btnYes').click()");
  await sleep(1500);
  console.log("overlays:", await ev("[...(" + F + ").querySelectorAll('[role=dialog],.modal,.toast,#toast,[role=status],[role=alert]')].map(e=>(e.id||e.className)+': '+e.innerText.replace(/\\s+/g,' ').slice(0,300)).join('\\n')"));
  console.log("buttons visible:", await ev("[...(" + F + ").querySelectorAll('button')].filter(b=>b.offsetParent&&b.closest('[role=dialog],.modal,.sheet,.consent')).map(b=>b.id+':'+b.innerText.trim()).join(' | ')"));
  await shot(require("path").join(require("os").tmpdir(), "probe-apply.png"));
};
