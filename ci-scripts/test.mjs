import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const log = (n, ok, i = "") => console.log(ok ? "OK " : "BAD", n, String(i).slice(0, 300));
const g = await fetch(`${BASE}/api/image?prompt=${encodeURIComponent("a red cat on a roof")}&size=1024x1024`);
log("GET /api/image", true, `${g.status} ${g.headers.get("content-type")} ${(await g.arrayBuffer()).byteLength}B`);
const c = await fetch(`${BASE}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "ارسم لي صورة قطة على سطح" }], model: "balanced" }) });
const ct = await c.text();
log("chat image md uses /api/image", ct.includes("/api/image?prompt="), `${c.status} ${ct.slice(0, 160)}`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 420, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
const r = await p.goto(`${BASE}/tool/ai-video`);
log("page ai-video", r.status() === 200, r.status());
await p.fill("textarea", "3 نصايح لتوفير الفلوس");
await p.click("text=اكتب السكريبت");
await p.waitForSelector("text=ولّد صور لكل المشاهد", { timeout: 60000 }).then(() => log("script written + gen-all button", true), (e) => log("script written", false, e.message));
await p.screenshot({ path: "ci/video-scenes.png", fullPage: true });
await p.click("button[aria-label='ولّد صورة للمشهد']").catch(() => {});
const res = await Promise.race([
  p.waitForSelector("img[class*='thumb']", { timeout: 170000 }).then(() => "image"),
  p.waitForSelector("[class*='warn']", { timeout: 170000 }).then(async (e) => "error: " + (await e.textContent())),
]).catch((e) => "timeout");
log("scene image result", String(res) === "image", res);
await p.screenshot({ path: "ci/video-after.png", fullPage: true });
log("no page errors", errs.length === 0, errs.join(" | "));
await b.close();
