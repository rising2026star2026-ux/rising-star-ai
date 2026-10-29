import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 420, height: 900 } });
await p.goto(`${BASE}/lab/remotion`);
await p.waitForSelector("#rm-render");
await p.fill("textarea", "3 حاجات بتضيّع وقتك كل يوم\nالموبايل أول ما تصحى");
await p.$eval("input[type=range]", (el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(el, "2.5"); el.dispatchEvent(new Event("input", { bubbles: true })); });
await p.click("#rm-render");
await p.waitForSelector("#rm-video", { timeout: 240000 });
const frames = await p.evaluate(async () => {
  const v = document.querySelector("#rm-video"); const out = [];
  await new Promise((r) => { if (v.readyState >= 1) r(); else v.onloadedmetadata = r; });
  for (const t of [0.6, 1.5, 3.2]) {
    v.currentTime = t; await new Promise((r) => (v.onseeked = r));
    const c = document.createElement("canvas"); c.width = 360; c.height = 640; c.getContext("2d").drawImage(v, 0, 0, 360, 640); out.push(c.toDataURL("image/jpeg", 0.8));
  }
  return out;
});
frames.forEach((f, i) => fs.writeFileSync(`ci/frame${i}.jpg`, Buffer.from(f.split(",")[1], "base64")));
console.log("OK frames", frames.length);
await b.close();
