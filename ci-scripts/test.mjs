import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://localhost:3000";
const log = (n, ok, i = "") => console.log(ok ? "OK " : "BAD", n, String(i).slice(0, 400));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 420, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
const r = await p.goto(`${BASE}/lab/remotion`);
log("page", r.status() === 200, r.status());
await p.waitForSelector("#rm-render", { timeout: 30000 }).then(() => log("editor loaded", true), (e) => log("editor loaded", false, e.message));
await p.fill("textarea", "مشهد أول تجريبي\nمشهد ثاني أجمل");
await p.$eval("input[type=range]", (el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(el, "2"); el.dispatchEvent(new Event("input", { bubbles: true })); });
await p.screenshot({ path: "ci/remotion-editor.png", fullPage: true });
const caps = await p.evaluate(async () => ({ VideoEncoder: typeof VideoEncoder, h264: await VideoEncoder.isConfigSupported({ codec: "avc1.640028", width: 720, height: 1280 }).then((x) => x.supported).catch(() => "err") }));
log("webcodecs", true, JSON.stringify(caps));
const t0 = Date.now();
await p.click("#rm-render");
const res = await Promise.race([
  p.waitForSelector("#rm-video", { timeout: 240000 }).then(() => "video"),
  p.waitForSelector("#rm-err", { timeout: 240000 }).then(async (e) => "error: " + (await e.textContent())),
]).catch(() => "timeout");
log("render result", res === "video", `${res} in ${Math.round((Date.now() - t0) / 1000)}s`);
if (res === "video") {
  const info = await p.$eval("#rm-dl", (a) => a.textContent);
  log("download link", true, info);
  const bytes = await p.evaluate(async () => { const v = document.querySelector("#rm-video"); const buf = await (await fetch(v.src)).arrayBuffer(); await new Promise((r) => { if (v.readyState >= 1) r(); else v.onloadedmetadata = r; setTimeout(r, 5000); }); return { size: buf.byteLength, dur: v.duration, w: v.videoWidth, h: v.videoHeight }; });
  log("video file", bytes.size > 5000 && bytes.dur > 3, JSON.stringify(bytes));
  await p.screenshot({ path: "ci/remotion-result.png", fullPage: true });
}
log("no page errors", errs.length === 0, errs.slice(0, 3).join(" | "));
await b.close();
