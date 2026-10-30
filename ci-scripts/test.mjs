// يفتح كل أداة جوه iframe حقيقي ويصوّرها
import { chromium } from "playwright";
import fs from "node:fs";
const web = JSON.parse(fs.readFileSync("ci/embed-web.json", "utf8"));
const hf = JSON.parse(fs.readFileSync("ci/embed-hf.json", "utf8"));
const items = [
  ...web.filter((x) => x.ok || /^HTTP (403|429)/.test(x.why)).map((x, i) => ({ key: "w" + i, name: x.name, url: x.url, src: "web" })),
  ...hf.filter((x) => x.ok).sort((a, b) => b.likes - a.likes).slice(0, 110).map((x, i) => ({ key: "h" + i, name: x.id, url: x.url, src: "hf" })),
];
console.log("to test", items.length);
fs.mkdirSync("ci/shots", { recursive: true });
const b = await chromium.launch();
const results = [];
let idx = 0;
async function worker() {
  const ctx = await b.newContext({ viewport: { width: 420, height: 880 }, userAgent: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36" });
  while (idx < items.length) {
    const it = items[idx++];
    const p = await ctx.newPage();
    const msgs = [];
    p.on("console", (m) => { const t = m.text(); if (/Refused to (display|frame)|frame-ancestors|X-Frame-Options/i.test(t)) msgs.push(t.slice(0, 120)); });
    let loaded = false;
    try {
      await p.setContent(`<body style="margin:0"><iframe id="f" src="${it.url}" style="width:420px;height:880px;border:0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" onload="window.__l=1"></iframe></body>`);
      await p.waitForFunction(() => window.__l === 1, null, { timeout: 25000 }).then(() => (loaded = true), () => {});
      await p.waitForTimeout(it.src === "hf" ? 9000 : 5000);
      await p.screenshot({ path: `ci/shots/${it.key}.jpg`, type: "jpeg", quality: 40 });
    } catch (e) { msgs.push("err " + e.message.slice(0, 60)); }
    results.push({ ...it, loaded, blocked: msgs });
    await p.close();
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: 6 }, worker));
fs.writeFileSync("ci/shots.json", JSON.stringify(results));
console.log("done", results.length, "blocked msgs", results.filter((r) => r.blocked.length).length);
await b.close();
