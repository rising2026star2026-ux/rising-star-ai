// تجربة الموقع في متصفح حقيقي على GitHub Actions (preview-check.yml):
// صور للصفحات على الموبايل والكمبيوتر، وتجارب فعلية للأدوات بمفاتيح الموديلات، وأخطاء الكونسول.
// كل النتايج بتتحفظ في ci-out وبعدين في فرع ci-results.
// تشغيل جزء بس: CI_ONLY="test-ad,receipt"
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { CHECKS } from "./plan.mjs";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "ci-out";
const ONLY = (process.env.CI_ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);

const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 },
};

await fs.mkdir(OUT, { recursive: true });
const summary = [];
const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });

for (const check of CHECKS) {
  if (ONLY.length && !ONLY.includes(check.name)) continue;
  for (const vp of check.viewports || ["mobile", "desktop"]) {
    const ctx = await browser.newContext({ ...VIEWPORTS[vp], locale: "ar-EG", permissions: ["microphone", "clipboard-read", "clipboard-write"] });
    await ctx.addInitScript(() => { try { sessionStorage.setItem("rs:intro", "1"); } catch {} });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 300)}`); });
    page.on("requestfailed", (r) => { const u = r.url(); if (u.startsWith(BASE)) errors.push(`requestfailed: ${u} ${r.failure()?.errorText}`); });
    const notes = [];
    const t0 = Date.now();
    let ok = true;
    const tag = `${check.name}-${vp}`;
    const shot = async (label, opts = {}) => {
      const file = path.join(OUT, `${tag}-${label}.jpg`);
      await page.screenshot({ path: file, type: "jpeg", quality: 62, fullPage: opts.full !== false, ...(opts.clip ? { clip: opts.clip, fullPage: false } : {}) });
    };
    const save = async (label, data) => fs.writeFile(path.join(OUT, `${tag}-${label}.json`), JSON.stringify(data, null, 2));
    try {
      await page.goto(BASE + check.path, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(check.settle ?? 1200);
      if (check.run) await check.run({ page, shot, save, note: (n) => notes.push(n), vp, BASE });
      else await shot("page");
    } catch (e) {
      ok = false;
      notes.push(`FAILED: ${String(e?.message || e).slice(0, 800)}`);
      try { await shot("failure"); } catch {}
    }
    summary.push({ check: check.name, vp, ok, ms: Date.now() - t0, notes, errors: errors.slice(0, 25) });
    await ctx.close();
  }
}

// تجارب الـ API المباشرة (من غير متصفح)
const { API_CHECKS = [] } = await import("./plan.mjs");
for (const a of API_CHECKS) {
  if (ONLY.length && !ONLY.includes(a.name)) continue;
  const t0 = Date.now();
  try {
    const out = await a.run({ BASE, OUT });
    summary.push({ check: `api:${a.name}`, ok: !!out?.ok, ms: Date.now() - t0, notes: out?.notes || [] });
    await fs.writeFile(path.join(OUT, `api-${a.name}.json`), JSON.stringify(out?.data ?? out, null, 2));
  } catch (e) {
    summary.push({ check: `api:${a.name}`, ok: false, ms: Date.now() - t0, notes: [String(e?.message || e).slice(0, 800)] });
  }
}

await browser.close();
await fs.writeFile(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
console.log(summary.map((s) => `${s.ok ? "✓" : "✗"} ${s.check}${s.vp ? ` (${s.vp})` : ""} ${s.ms}ms ${s.errors?.length ? `errors=${s.errors.length}` : ""}`).join("\n"));
