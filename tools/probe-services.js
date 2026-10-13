module.exports = async ({ ev, sleep, nav }) => {
  const F = "document.querySelector('iframe').contentDocument";
  await nav("http://127.0.0.1:8766/");
  await sleep(1200);
  await ev(F + ".getElementById('nb-svc').click()");
  await sleep(500);
  console.log("after Services tap:", await ev("[...(" + F + ").querySelectorAll('button,[role=tab]')].filter(b=>b.offsetParent).map(b=>b.innerText.trim().split('\\n')[0]).join(' | ')"));
};
