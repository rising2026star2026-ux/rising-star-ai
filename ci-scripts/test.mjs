// يختبر مكتبة الأدوات: الصفحة الرئيسية + كل صفحة أداة بالإطار
import { chromium } from "playwright";
import fs from "node:fs";
const src = fs.readFileSync("lib/library.js", "utf8");
const slugs = [...src.matchAll(/T\("([a-z0-9-]+)"/g)].map((m) => m[1]);
const phet = [...src.matchAll(/\["([a-z-]+)", "(?=[^\x00-\x7F])/g)].map((m) => "phet-" + m[1]);
const all = [...slugs, ...phet].filter((x) => ["drawio","markmap","qwen-edit-2511","qwen-layered","remove-bg-dis","step1x-3d","squoosh","sqlime","transform","photopea","makecode"].includes(x));
console.log("slugs", all.length);
fs.rmSync("ci/lib", { recursive: true, force: true });
fs.mkdirSync("ci/lib", { recursive: true });
const b = await chromium.launch();
const errs = [];
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push("index " + e.message));
  const r = await p.goto("http://localhost:3000/library");
  console.log("index", r.status());
  await p.screenshot({ path: "ci/lib/_index.jpg", type: "jpeg", quality: 50, fullPage: true });
  await p.fill("input[type=search]", "خلفية");
  await p.waitForTimeout(300);
  console.log("search hits", await p.locator("a[href^='/library/']").count());
  await ctx.close();
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const q = await m.newPage();
  await q.goto("http://localhost:3000/library");
  await q.screenshot({ path: "ci/lib/_index_m.jpg", type: "jpeg", quality: 50 });
  await q.goto("http://localhost:3000/library/remove-bg");
  await q.waitForTimeout(8000);
  await q.screenshot({ path: "ci/lib/_tool_m.jpg", type: "jpeg", quality: 50, fullPage: true });
  await m.close();
}
const results = [];
let idx = 0;
async function worker() {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  while (idx < all.length) {
    const slug = all[idx++];
    const p = await ctx.newPage();
    const blocked = [];
    p.on("console", (m) => { const t = m.text(); if (/Refused to (display|frame)|frame-ancestors|X-Frame-Options/i.test(t)) blocked.push(t.slice(0, 120)); });
    p.on("pageerror", (e) => errs.push(slug + " " + e.message));
    let status = 0, loaded = false;
    try {
      const r = await p.goto(`http://localhost:3000/library/${slug}`);
      status = r.status();
      const hf = await p.locator("iframe").getAttribute("src").then((u) => u.includes("hf.space"));
      await p.waitForFunction(() => !document.body.innerText.includes("جاري فتح"), null, { timeout: 30000 }).then(() => (loaded = true), () => {});
      await p.waitForTimeout(hf ? 10000 : 5000);
      await p.locator("iframe").screenshot({ path: `ci/lib/${slug}.jpg`, type: "jpeg", quality: 35 });
    } catch (e) { blocked.push("err " + e.message.slice(0, 80)); }
    results.push({ slug, status, loaded, blocked });
    await p.close();
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: 6 }, worker));
fs.writeFileSync("ci/lib.json", JSON.stringify(results));
console.log("done", results.length, "bad", results.filter((r) => r.status !== 200 || !r.loaded || r.blocked.length).map((r) => r.slug + ":" + r.status + ":" + r.loaded + ":" + r.blocked.join("|")).join("\n"));
console.log("pageerrors", errs.slice(0, 20).join("\n"));
await b.close();
