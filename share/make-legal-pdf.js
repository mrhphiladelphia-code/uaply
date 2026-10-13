/* Turns LEGAL-REVIEW.md into a styled HTML page, then prints it to PDF with the browser already on this computer.
   Run from the project folder:  node share/make-legal-pdf.js
   Output: UApply-legal-review.pdf (plain text and tables only; no network). */
const fs = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");

const md = fs.readFileSync("LEGAL-REVIEW.md", "utf8").replace(/\r/g, "").split("\n");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
  .replace(/\*([^*]+)\*/g, "<i>$1</i>");

let html = "", list = null, table = null, para = [];
const flushPara = () => { if (para.length) { html += "<p>" + inline(para.join(" ")) + "</p>"; para = []; } };
const flushList = () => { if (list) { html += "</" + list + ">"; list = null; } };
const flushTable = () => { if (table) { html += "<table>" + table.map((r, i) => "<tr>" + r.map((c) => (i ? "<td>" : "<th>") + inline(c) + (i ? "</td>" : "</th>")).join("") + "</tr>").join("") + "</table>"; table = null; } };
const flushAll = () => { flushPara(); flushList(); flushTable(); };

for (const line of md) {
  let m;
  if (/^\s*$/.test(line)) { flushAll(); continue; }
  if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) { flushAll(); html += "<h" + m[1].length + ">" + inline(m[2]) + "</h" + m[1].length + ">"; continue; }
  if (/^\|/.test(line)) {
    flushPara(); flushList();
    const cells = line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
    (table = table || []).push(cells); continue;
  }
  if ((m = /^\s*(\d+)\.\s+(.*)$/.exec(line))) { flushPara(); flushTable(); if (list !== "ol") { flushList(); html += "<ol>"; list = "ol"; } html += "<li>" + inline(m[2]) + "</li>"; continue; }
  if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) { flushPara(); flushTable(); if (list !== "ul") { flushList(); html += "<ul>"; list = "ul"; } html += "<li>" + inline(m[1]) + "</li>"; continue; }
  flushList(); flushTable(); para.push(line.trim());
}
flushAll();

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>UApply legal risk review</title><style>
@page{size:Letter;margin:18mm 16mm}
body{font:11pt/1.5 'Segoe UI',Arial,sans-serif;color:#2A1218;margin:0}
h1{font:800 22pt/1.15 'Segoe UI',Arial,sans-serif;color:#C92A55;margin:0 0 6pt}
h2{font:700 14pt/1.25 'Segoe UI',Arial,sans-serif;margin:18pt 0 4pt;padding-top:6pt;border-top:1px solid #F3DADF;break-after:avoid}
p,li{margin:4pt 0}ul,ol{padding-left:18pt}
table{width:100%;border-collapse:collapse;font-size:9.5pt;margin:6pt 0;break-inside:auto}
tr{break-inside:avoid}
th,td{text-align:left;vertical-align:top;border:1px solid #E3C8CE;padding:4pt 6pt}
th{background:#FDF0F2}
code{font:9.5pt Consolas,monospace;background:#FDF0F2;padding:0 2pt;border-radius:2pt}
.banner{border:1px solid #E9B44C;background:#FCEFD0;color:#5A3700;border-radius:6pt;padding:6pt 10pt;font-size:10pt;margin:0 0 10pt}
.foot{margin-top:18pt;color:#7B5560;font-size:9pt}
</style></head><body>${html.replace("</h1>", "</h1><div class=\"banner\"><b>Draft risk review. Not legal advice.</b> Prepared by an AI assistant. Have a licensed attorney review before publishing or submitting to an app store.</div>")}
<div class="foot">Generated ${new Date().toISOString().slice(0, 10)} from LEGAL-REVIEW.md in the UApply project.</div></body></html>`;

const htmlPath = path.resolve("share", "legal-review.print.html");
fs.writeFileSync(htmlPath, page);
const out = path.resolve("UApply-legal-review.pdf");
const browsers = [process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].filter((p) => fs.existsSync(p));
if (!browsers.length) { console.error("No Chrome or Edge found to print the PDF."); process.exit(1); }
const r = spawnSync(browsers[0], ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--print-to-pdf=" + out, "file:///" + htmlPath.replace(/\\/g, "/")], { encoding: "utf8", timeout: 60000 });
fs.unlinkSync(htmlPath);
if (!fs.existsSync(out)) { console.error("PDF was not created.", r.stderr); process.exit(1); }
console.log("wrote " + out + " (" + Math.round(fs.statSync(out).size / 1024) + " KB) using " + path.basename(browsers[0]));
