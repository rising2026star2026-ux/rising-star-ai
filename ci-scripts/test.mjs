// اختبار على السيرفر المبني: الأدوات الجديدة + قارئ الصور بصورة فيها نص
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://localhost:3000";
const out = { checks: [] };
const log = (name, ok, info = "") => { out.checks.push({ name, ok, info: String(info).slice(0, 700) }); console.log(ok ? "OK " : "BAD", name, String(info).slice(0, 200)); };

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 420, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));

// 1) صفحات الأدوات
for (const id of ["image-reader", "sheet-analyst", "video-qa", "gem-assistant"]) {
  const r = await p.goto(`${BASE}/tool/${id}`);
  const h1 = await p.textContent("h1").catch(() => "");
  log(`page ${id}`, r.status() === 200 && !!h1, `${r.status()} ${h1}`);
  await p.screenshot({ path: `ci/${id}.png`, fullPage: false });
}
for (const k of ["gemini-live", "aistudio"]) {
  const r = await p.goto(`${BASE}/program/${k}`);
  log(`program ${k}`, r.status() === 200, r.status());
}
const r2 = await p.goto(`${BASE}/tools`); log("tools list", r2.status() === 200);
const html = await p.content();
log("tools list shows new", ["قارئ الصور", "محلل الجداول", "مساعد مخصص"].every((t) => html.includes(t)));

// 2) الأدوات النصية الجديدة عبر /api/run
async function run(toolId, input) {
  const res = await fetch(`${BASE}/api/run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ toolId, input }) });
  return { status: res.status, text: (await res.text()).slice(0, 600) };
}
const sheet = await run("sheet-analyst", "الشهر\tالمبيعات\nيناير\t1200\nفبراير\t1500\nمارس\t1350\n\nالسؤال: أي شهر أعلى ونسبة الزيادة من يناير؟");
log("run sheet-analyst", sheet.status === 200 && /فبراير|1500|٢٥|25/.test(sheet.text), sheet.text);
const gem = await run("gem-assistant", "التعليمات: أنت مدرب لياقة بيتكلم مصري ومشجع.\nالسؤال: عايز أبدأ رياضة في البيت.");
log("run gem-assistant", gem.status === 200 && gem.text.length > 40, gem.text);
const yt = await run("video-qa", "اتكلمنا النهارده عن الميزانية. أول خطوة تكتب دخلك ومصاريفك شهر. تاني خطوة تقسمهم ثابتة ومتغيرة.\n\nالسؤال: إيه الخطوات؟");
log("run video-qa", yt.status === 200 && yt.text.length > 40, yt.text);

// 3) قارئ الصور بصورة فيها نص حقيقي
await p.goto(`${BASE}/tool/image-reader`);
const dataUrl = await p.evaluate(() => {
  const c = document.createElement("canvas"); c.width = 700; c.height = 260;
  const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 700, 260);
  g.fillStyle = "#111"; g.font = "bold 56px Arial"; g.fillText("TOTAL: 1450 EGP", 40, 110);
  g.font = "36px Arial"; g.fillText("Invoice 7731 - Cairo", 40, 190);
  return c.toDataURL("image/jpeg", 0.9);
});
const v = await fetch(`${BASE}/api/vision`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image: dataUrl, question: "اقرا النص اللي في الصورة" }) });
const vj = await v.json().catch(() => ({}));
log("api vision reads text", v.status === 200 && /1450/.test(vj.text || ""), JSON.stringify(vj));
const bad = await fetch(`${BASE}/api/vision`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image: "data:text/html;base64,AAAA" }) });
log("api vision rejects non-image", bad.status === 400, bad.status);

// 4) واجهة قارئ الصور من المتصفح: رفع ملف فعلي
fs.writeFileSync("ci/_t.jpg", Buffer.from(dataUrl.split(",")[1], "base64"));
await p.setInputFiles('input[type=file]', "ci/_t.jpg");
await p.waitForSelector("img[alt='الصورة المرفوعة']", { timeout: 8000 });
await p.fill("#vq", "اقرا النص اللي في الصورة");
await p.click("button:has-text('نفّذ')");
await p.waitForSelector(".result .md", { timeout: 60000 }).catch(() => {});
const shown = await p.textContent(".result").catch(() => "");
log("ui vision result", /1450/.test(shown || ""), shown);
await p.screenshot({ path: "ci/vision-ui.png", fullPage: true });
fs.unlinkSync("ci/_t.jpg");

log("no page errors", errs.length === 0, errs.join(" | "));
fs.writeFileSync("ci/results.json", JSON.stringify(out, null, 2));
await b.close();
