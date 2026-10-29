import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const log = (n, ok, i = "") => console.log(ok ? "OK " : "BAD", n, String(i).slice(0, 300));
const b = await chromium.launch();
for (const [name, vp] of [["mobile", { width: 420, height: 900 }], ["desktop", { width: 1280, height: 800 }]]) {
  const p = await b.newPage({ viewport: vp });
  await p.goto(`${BASE}/`);
  await p.waitForSelector("h1 em", { state: "attached" });
  await p.waitForTimeout(6000);
  const m = await p.$eval("h1", (h) => ({ fs: parseFloat(getComputedStyle(h).fontSize), ai: getComputedStyle(h.querySelector("em")).color, text: h.textContent, w: h.getBoundingClientRect().width, vw: innerWidth }));
  log(`${name} text`, m.text.replace(/\s/g, "") === "RisingStarAi", m.text);
  log(`${name} Ai blue`, m.ai === "rgb(74, 116, 255)", m.ai);
  log(`${name} size`, true, `${m.fs}px width ${Math.round(m.w)}/${m.vw}`);
  await p.screenshot({ path: `ci/home-${name}.png` });
}
await b.close();
