// Loads a hosted (static) page at phone size and checks it starts and shows the legal block. URL=https://... node tools/cdp.js tools/ui-hosted.js
module.exports = async ({ ev, sleep, nav }) => {
  const F = "document.querySelector('iframe').contentDocument";
  await nav(process.env.URL);
  await sleep(2500);
  console.log("title:", await ev("document.title"));
  console.log("job cards:", await ev(F + ".querySelectorAll('.card').length"));
  await ev(F + ".getElementById('nb-prof').click()");
  await sleep(500);
  const ok = await ev("(()=>{const e=[...(" + F + ").querySelectorAll('button')].find(b=>b.innerText.trim().startsWith('Data'));if(!e)return false;e.click();return true})()");
  await sleep(500);
  console.log("Data & privacy opens:", ok, "| legal links:", await ev(F + ".querySelectorAll('[data-legal]').length"));
  console.log("legal link hrefs:", await ev("[...(" + F + ").querySelectorAll('[data-legal]')].map(a=>a.href).slice(0,2).join(' ')"));
};
