import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const log = (n, ok, i = "") => console.log(ok ? "OK " : "BAD", n, String(i).slice(0, 300));
const b = await chromium.launch();
for (const [name, vp] of [["mobile", { width: 420, height: 900 }], ["desktop", { width: 1280, height: 800 }]]) {
  const p = await b.newPage({ viewport: vp });
  await p.goto(`${BASE}/chat`);
  const m = await p.$eval("textarea", (t) => { const c = getComputedStyle(t); const r = t.getBoundingClientRect(); return { fs: parseFloat(c.fontSize), h: r.height, w: r.width }; });
  log(`${name} font 14px`, m.fs === 14, m.fs);
  log(`${name} height >= 84`, m.h >= 84, Math.round(m.h));
  await p.fill("textarea", "سطر\nسطر\nسطر\nسطر\nسطر\nسطر\nسطر\nسطر\nسطر\nسطر");
  const h2 = await p.$eval("textarea", (t) => t.getBoundingClientRect().height);
  log(`${name} grows with text, capped 280`, h2 > m.h && h2 <= 281, Math.round(h2));
  await p.screenshot({ path: `ci/composer-${name}.png` });
}
await b.close();
