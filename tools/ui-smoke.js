module.exports = async ({ ev, sleep, nav, shot }) => {
  const F = "document.querySelector('iframe').contentDocument";
  await nav("http://localhost:8766/");
  console.log("title:", await ev("document.title"));
  console.log("cards:", await ev(F + ".querySelectorAll('.card').length"));
  const ids = ["tab-swipe", "tab-apps", "tab-dash", "tab-profile", "nb-svc", "nb-dash", "nb-prof", "hdrAcct", "uaChatBtn"];
  for (const i of ids) console.log(i, await ev("!!" + F + ".getElementById('" + i + "')"));
  await shot(require("path").join(require("os").tmpdir(), "sandbox-smoke.png"));
};
