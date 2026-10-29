import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://localhost:3000";
const b = await chromium.launch();
const errs = [];
const ids = ["tips", "numbered", "quote", "ad", "typing", "stats"];
for (const id of ids) {
  const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  p.on("pageerror", (e) => errs.push(id + ": " + String(e)));
  await p.goto(`${BASE}/tool/reel-pro`);
  await p.waitForSelector("#rm-render:not([disabled])", { timeout: 30000 });
  await p.$eval("input[type=range]", (el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(el, "2"); el.dispatchEvent(new Event("input", { bubbles: true })); });
  await p.click(`[data-tpl='${id}']`);
  await p.waitForTimeout(400);
  const n = (await p.inputValue("textarea[aria-label='المشاهد']")).split("\n").filter(Boolean).length;
  const t0 = Date.now();
  await p.click("#rm-render");
  const res = await Promise.race([p.waitForSelector("#rm-video", { timeout: 120000 }).then(() => "video"), p.waitForSelector("#rm-err", { timeout: 120000 }).then(async (e) => "error " + (await e.textContent()))]).catch(() => "timeout");
  console.log(res === "video" ? "OK " : "BAD", id, n + " scenes", res, Math.round((Date.now() - t0) / 1000) + "s");
  if (res === "video") {
    const times = [1.2, 2 * Math.floor(n / 2) + 1.2, 2 * (n - 1) + 1.2];
    const frames = await p.evaluate(async (times) => {
      const v = document.querySelector("#rm-video"); const out = [];
      await new Promise((r) => { if (v.readyState >= 1) r(); else v.onloadedmetadata = r; });
      for (const t of times) { v.currentTime = Math.min(t, v.duration - 0.05); await new Promise((r) => (v.onseeked = r)); const c = document.createElement("canvas"); c.width = 240; c.height = 427; c.getContext("2d").drawImage(v, 0, 0, 240, 427); out.push(c.toDataURL("image/jpeg", 0.8)); }
      return out;
    }, times);
    frames.forEach((f, i) => fs.writeFileSync(`ci/${id}-${i}.jpg`, Buffer.from(f.split(",")[1], "base64")));
  }
  await p.close();
}
console.log(errs.length ? "BAD page errors: " + errs.join(" | ") : "OK no page errors");
await b.close();
