import { chromium } from "playwright";
import fs from "node:fs";
import { execSync } from "node:child_process";
const sh = (c) => { try { return execSync(c + " 2>&1", { encoding: "utf8", timeout: 120000 }); } catch (e) { return "ERR " + String(e.stdout || e.message).slice(0, 800); } };
fs.rmSync("ci/vf", { recursive: true, force: true });
fs.mkdirSync("ci/vf", { recursive: true });
const BASE = "http://localhost:3000";

// 1) TTS مباشرة
{
  const t0 = Date.now();
  const r = await fetch(BASE + "/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "ازيك يا صاحبي، النهارده هنتكلم عن فوايد القهوة", voice: "ar-EG-SalmaNeural" }) });
  const buf = Buffer.from(await r.arrayBuffer());
  console.log("TTS", r.status, r.headers.get("content-type"), buf.length, "bytes", Date.now() - t0, "ms", r.status !== 200 ? buf.toString().slice(0, 200) : "");
  if (r.status === 200) { fs.writeFileSync("ci/vf/tts.mp3", buf); console.log(sh("ffprobe -v error -show_entries format=duration,bit_rate -of default=nw=1 ci/vf/tts.mp3")); }
  const bad = await fetch(BASE + "/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "" }) });
  console.log("TTS empty", bad.status);
}
// 2) pexels بدون مفتاح
console.log("PEXELS nokey", (await fetch(BASE + "/api/pexels?q=coffee")).status);
// 3) واجهة Chatterbox
try {
  const j = await (await fetch("https://resembleai-chatterbox-multilingual-tts.hf.space/gradio_api/info")).json();
  for (const [k, v] of Object.entries(j.named_endpoints)) console.log("CB", k, "IN:", v.parameters.map((x) => `${x.parameter_name}(${x.label}|${x.component}|${JSON.stringify(x.parameter_default)?.slice(0, 50)})`).join(", "), "OUT:", v.returns.map((x) => x.component + ":" + x.label).join(", "));
} catch (e) { console.log("chatterbox info err", e.message); }
try {
  const H = "https://resembleai-chatterbox-multilingual-tts.hf.space/gradio_api";
  const r1 = await fetch(H + "/call/generate_tts_audio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: ["ازيك يا صاحبي النهارده هنتكلم عن القهوة", "ar", null, 0.5, 0.8, 7, 0.5] }) });
  const j1 = await r1.json().catch(() => ({}));
  console.log("CB call", r1.status, JSON.stringify(j1).slice(0, 200));
  if (j1.event_id) { const r2 = await fetch(H + "/call/generate_tts_audio/" + j1.event_id); const txt = await r2.text(); console.log("CB events", txt.slice(0, 700)); }
} catch (e) { console.log("CB raw err", e.message); }
// 4) CORS لفيديو MDN
const FLOWER = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm";

const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
async function run(name, mockVideo, doRender = true) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push("PAGEERR " + e.message.slice(0, 200)));
  p.on("console", (m) => { if (m.type() === "error" || /BACKUP/.test(m.text())) errs.push("CONSOLE " + m.text().slice(0, 200)); });
  if (name === "fallback") await p.route("**/api/tts", (route) => route.fulfill({ status: 502, contentType: "application/json", body: '{"error":"tts_unavailable"}' }));
  if (mockVideo) {
    await p.route("**/api/pexels**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [1, 2, 3].map((i) => ({ id: i, url: FLOWER, thumb: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=", duration: 10, page: "https://www.pexels.com/", by: "Test" + i, byUrl: "" })) }) }));
  }
  await p.goto(BASE + "/tool/video-factory");
  await p.waitForSelector("#vf-topic", { timeout: 30000 });
  await p.fill("#vf-topic", "فوايد القهوة");
  const t0 = Date.now();
  await p.click("#vf-make");
  await p.waitForFunction(() => !document.querySelector("#vf-make")?.textContent.includes("بيشتغل"), null, { timeout: 120000 }).catch(() => {});
  console.log(name, "make took", ((Date.now() - t0) / 1000).toFixed(1) + "s", "scenes:", await p.locator("[data-scene]").count(), "err:", await p.locator("#vf-err").textContent().catch(() => ""), "notes:", await p.locator("p").allTextContents().then((a) => a.filter((x) => x.includes("مفعّل") || x.includes("الصوت")).join(" / ")));
  await p.waitForTimeout(2500);
  await p.locator("[data-vf=preview]").screenshot({ path: `ci/vf/${name}_player.jpg`, type: "jpeg", quality: 60 }).catch(() => {});
  await p.locator("[data-vf=preview]").click({ position: { x: 100, y: 150 } }).catch(() => {});
  await p.waitForTimeout(3000);
  await p.locator("[data-vf=preview]").screenshot({ path: `ci/vf/${name}_player_play.jpg`, type: "jpeg", quality: 60 }).catch(() => {});
  console.log(name, "preview box", JSON.stringify(await p.locator("[data-vf=preview]").boundingBox()), "inner", await p.locator("[data-vf=preview] > div").first().evaluate((el) => el.outerHTML.slice(0, 300)).catch(() => ""));
  await p.screenshot({ path: `ci/vf/${name}_ui.jpg`, type: "jpeg", quality: 55, fullPage: true });
  if (!doRender) { await ctx.close(); return; }
  const t1 = Date.now();
  await p.click("#vf-render");
  await p.waitForSelector("#vf-video", { timeout: 240000 }).catch(() => {});
  console.log(name, "render took", ((Date.now() - t1) / 1000).toFixed(1) + "s", "err:", await p.locator("#vf-err").textContent().catch(() => "none"));
  if (await p.locator("#vf-dl").count()) {
    const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#vf-dl")]);
    const ext = (await dl.suggestedFilename()).split(".").pop();
    const path = `ci/vf/${name}.${ext}`;
    await dl.saveAs(path);
    console.log(name, "file", path, fs.statSync(path).size, "bytes");
    console.log(sh(`ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,duration -of compact ${path}`));
    sh(`ffmpeg -y -ss 2 -i ${path} -frames:v 1 ci/vf/${name}_f2.jpg`);
    sh(`ffmpeg -y -ss 9 -i ${path} -frames:v 1 ci/vf/${name}_f9.jpg`);
    console.log(name, "audio volume", sh(`ffmpeg -i ${path} -af volumedetect -vn -f null - 2>&1 | grep -E 'mean_volume|max_volume'`));
  }
  console.log(name, "errs:", errs.slice(0, 8).join(" | "));
  await ctx.close();
}
await run("nopexels", false, false);
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(BASE + "/lab/factory");
  await p.fill("#vf-topic", "قهوة");
  await p.click("#vf-make");
  await p.waitForSelector("[data-vf=preview]", { timeout: 60000 });
  await p.waitForTimeout(4000);
  const dump = await p.evaluate(() => {
    const out = [];
    const walk = (el, d) => { if (d > 9 || out.length > 40) return; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); out.push(`${"  ".repeat(d)}${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.left)},${Math.round(r.top)} ov=${cs.overflow} tf=${cs.transform === "none" ? "" : cs.transform.slice(0, 40)} disp=${cs.display}`); for (const c of el.children) walk(c, d + 1); };
    walk(document.querySelector("[data-vf=preview]"), 0);
    return out.join("\n");
  });
  console.log("DOMDUMP\n" + dump);
  await ctx.close();
  const c2 = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: true });
  const q = await c2.newPage();
  await q.goto(BASE + "/tool/reel-pro");
  await q.waitForTimeout(5000);
  await q.screenshot({ path: "ci/vf/reel_ref.jpg", type: "jpeg", quality: 50 });
  await c2.close();
}
await run("mock", true);
await b.close();
