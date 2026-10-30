import { chromium } from "playwright";
import fs from "fs";
fs.mkdirSync("ci/pa", { recursive: true });
const b = await chromium.launch();
const log = {};
const p = await (await b.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, acceptDownloads: true })).newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 200)); });
await p.goto("http://localhost:3000/tool/product-ad", { waitUntil: "networkidle" });
// صورة منتج تجريبية: زجاجة بسيطة على خلفية بيضا
const dataUrl = await p.evaluate(() => {
  const c = document.createElement("canvas"); c.width = 800; c.height = 1000;
  const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 800, 1000);
  x.fillStyle = "#c2185b"; x.beginPath(); x.roundRect(250, 300, 300, 600, 60); x.fill();
  x.fillStyle = "#333"; x.fillRect(340, 180, 120, 140);
  x.fillStyle = "#fff"; x.font = "bold 60px sans-serif"; x.fillText("SKIN", 310, 620);
  return c.toDataURL("image/jpeg", 0.9);
});
await p.setInputFiles("#pa-file", { name: "product.jpg", mimeType: "image/jpeg", buffer: Buffer.from(dataUrl.split(",")[1], "base64") });
await p.fill("#pa-name", "سيروم الوجه الطبيعي");
await p.fill("#pa-tag", "بشرة صافية كل يوم");
await p.getByLabel("ميزة 1").fill("خفيف على البشرة");
await p.getByLabel("ميزة 2").fill("بيمتص بسرعة");
await p.getByLabel("ميزة 3").fill("مناسب للاستخدام اليومي");
await p.fill("#pa-offer", "299 جنيه");
await p.fill("#pa-cta", "اطلب دلوقتي على واتساب");
await p.fill("#pa-handle", "01012345678");
await p.waitForTimeout(1500);
await p.screenshot({ path: "ci/pa/form.png", fullPage: true });
// معاينة: نقفز لإطارات من الـPlayer
const pv = p.locator("[data-pa=preview]");
log.preview = await pv.count();
await pv.scrollIntoViewIfNeeded();
await pv.screenshot({ path: "ci/pa/prev0.png" });
for (const fmt of ["s", "h"]) { await p.selectOption("#pa-fmt", fmt); await p.waitForTimeout(800); await pv.screenshot({ path: `ci/pa/prev-${fmt}.png` }); }
await p.selectOption("#pa-fmt", "v");
await p.waitForTimeout(500);
// تصدير فعلي
const t0 = Date.now();
await p.click("#pa-render");
try {
  await p.waitForSelector("#pa-video", { timeout: 150000 });
  log.exportMs = Date.now() - t0;
  const info = await p.evaluate(() => { const v = document.querySelector("#pa-video"); return { src: v.src.slice(0, 30), dl: document.querySelector("#pa-dl").textContent }; });
  log.out = info;
  const dl = await Promise.all([p.waitForEvent("download"), p.click("#pa-dl")]);
  await dl[0].saveAs("ci/pa/out." + (info.dl.includes("MP4") ? "mp4" : "webm"));
} catch (e) { log.exportErr = String(e).slice(0, 300); log.errText = await p.locator("#pa-err").textContent().catch(() => null); }
await p.screenshot({ path: "ci/pa/end.png", fullPage: true });
log.errs = errs;
fs.writeFileSync("ci/pa/info.json", JSON.stringify(log, null, 1));
await b.close();
