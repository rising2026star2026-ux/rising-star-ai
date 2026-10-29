import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const log = (n, ok, i = "") => console.log(ok ? "OK " : "BAD", n, String(i).slice(0, 300));
const b = await chromium.launch();
for (const [name, vp] of [["mobile", { width: 420, height: 900 }], ["desktop", { width: 1280, height: 800 }]]) {
  const p = await b.newPage({ viewport: vp });
  await p.goto(`${BASE}/chat`);
  await p.waitForTimeout(2500);
  const m = await p.$eval(".top-logo .logo-name", (n) => ({ fs: parseFloat(getComputedStyle(n).fontSize), ai: getComputedStyle(n.querySelector(".logo-ai")).color, text: n.textContent, rest: getComputedStyle(n).color }));
  log(`${name} text`, m.text === "Rising StarAi", m.text);
  log(`${name} Ai blue`, m.ai === "rgb(74, 116, 255)", m.ai);
  log(`${name} size`, true, m.fs + "px, rest color " + m.rest);
  await p.screenshot({ path: `ci/logo-${name}.png`, clip: { x: 0, y: 0, width: vp.width, height: 90 } });
}
await b.close();
