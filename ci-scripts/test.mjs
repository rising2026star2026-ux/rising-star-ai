import { chromium } from "playwright";
import fs from "node:fs";
fs.rmSync("ci/ag", { recursive: true, force: true });
fs.mkdirSync("ci/ag", { recursive: true });
// API مباشرة
for (const [agent, inputs] of [["research", { topic: "أفضل طرق تسويق مشروع أكل بيتي في مصر" }], ["factcheck", { claim: "شرب الماء البارد بعد الأكل بيسبب السرطان" }]]) {
  const t0 = Date.now();
  const r = await fetch("http://localhost:3000/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent, inputs }) });
  const txt = await r.text();
  const ev = txt.split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const out = ev.filter((e) => e.t === "x").map((e) => e.d).join("");
  console.log(agent, r.status, ((Date.now() - t0) / 1000).toFixed(1) + "s", "steps:", ev.filter((e) => e.t === "step").map((e) => e.m).join(" | "), "err:", ev.filter((e) => e.t === "err").map((e) => e.m).join(), "len:", out.length);
  console.log(out.slice(0, 700));
}
const bad = await fetch("http://localhost:3000/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent: "market", inputs: {} }) });
console.log("missing field", bad.status, await bad.text());
const b = await chromium.launch();
const errs = [];
const m = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
const p = await m.newPage();
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://localhost:3000/agents");
await p.screenshot({ path: "ci/ag/index.jpg", type: "jpeg", quality: 50, fullPage: true });
await p.goto("http://localhost:3000/agents/market");
await p.fill("textarea", "محل عصاير فريش جنب جامعة");
await p.click("button[type=submit]");
await p.waitForSelector("text=المخاطر", { timeout: 90000 }).catch(() => {});
await p.waitForTimeout(15000);
await p.screenshot({ path: "ci/ag/market.jpg", type: "jpeg", quality: 50, fullPage: true });
console.log("pageerrors", errs.join(" | "));
await b.close();
