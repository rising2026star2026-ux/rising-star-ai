// أدوات مشتركة للروبوت: خطوات بأسماء عربي، تنزيل ملفات، رسايل الخطأ، وانتظار النتيجة
import fs from "node:fs/promises";
import path from "node:path";

export const FIX = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "ci", "fixtures");
export const fix = (name) => path.join(FIX, name);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** خطأ بنتيجة واضحة للتقرير (مش خطأ في الروبوت نفسه) */
export class Verdict extends Error {
  constructor(level, text, tech = "") {
    super(text);
    this.level = level; // broken | warn
    this.tech = tech;
  }
}
export const broken = (text, tech) => new Verdict("broken", text, tech);
export const warn = (text, tech) => new Verdict("warn", text, tech);

/** خطوة باسم عربي: لو وقعت، التقرير بيقول «وقفت عند: …» بدل رسالة Playwright الإنجليزي */
export async function step(name, fn) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Verdict) throw e;
    const msg = String(e?.message || e);
    const tech = msg.split("\n").slice(0, 3).join(" ").slice(0, 400);
    if (/Timeout|exceeded/i.test(msg)) throw broken(`وقفت عند «${name}»: ما حصلش اللي متوقع في الوقت المسموح`, tech);
    throw broken(`وقفت عند «${name}»`, tech);
  }
}

/** نص أي رسالة خطأ ظاهرة للمستخدم (role=alert أو .error) */
export async function visibleError(page, scope = page) {
  const loc = scope.locator('[role="alert"], .error');
  const n = await loc.count().catch(() => 0);
  for (let i = 0; i < n; i++) {
    const el = loc.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    const t = (await el.innerText().catch(() => "")).trim();
    if (t.length > 3) return t.slice(0, 300);
  }
  return "";
}

/** يضغط زرار ويستنى ملف ينزل، ويتأكد إن الملف مش فاضي */
export async function clickDownload(page, name, { timeout = 45000, scope = page, minBytes = 200 } = {}) {
  const btn = typeof name === "object" && name.click ? name : scope.getByRole("button", { name }).first();
  await btn.waitFor({ state: "visible", timeout: 20000 });
  const wait = page.waitForEvent("download", { timeout });
  await btn.click();
  let d;
  try {
    d = await wait;
  } catch {
    const err = await visibleError(page);
    throw broken(err ? `الزرار «${label(name)}» طلّع خطأ: ${err}` : `الزرار «${label(name)}» ما نزّلش أي ملف`);
  }
  const file = await d.path().catch(() => null);
  const size = file ? (await fs.stat(file)).size : 0;
  if (size < minBytes) throw broken(`الملف اللي نزل فاضي أو بايظ (${size} بايت)`);
  return { size, name: d.suggestedFilename() };
}
const label = (n) => (n instanceof RegExp ? n.source.replace(/[\^$\\]/g, "") : String(n));

/** طول الكلام الظاهر في الصفحة (عشان نعرف إن نتيجة ظهرت) */
export const textLength = (page) => page.evaluate(() => (document.querySelector("main") || document.body).innerText.length);

/**
 * يستنى لحد ما الصفحة تكتب نتيجة: الكلام يزيد بقدر معيّن ويثبت شوية،
 * أو تظهر رسالة خطأ (يرجعها). بيرجع { grew, error }
 */
export async function waitForResult(page, before, { minGrowth = 250, timeout = 120000, stableMs = 2500, busy } = {}) {
  const t0 = Date.now();
  let last = -1, lastChange = Date.now();
  while (Date.now() - t0 < timeout) {
    await sleep(700);
    const err = await visibleError(page);
    if (err) return { grew: 0, error: err };
    const now = await textLength(page).catch(() => before);
    if (now !== last) { last = now; lastChange = Date.now(); }
    const stillBusy = busy ? await busy() : false;
    if (now - before >= minGrowth && Date.now() - lastChange >= stableMs && !stillBusy) return { grew: now - before, error: "" };
  }
  return { grew: Math.max(0, last - before), error: "", timedOut: true };
}

/** نسبة الحروف العربي في نص (عشان نكتشف ردود إنجليزي في أدوات عربي) */
export function arabicRatio(text) {
  const letters = text.match(/\p{L}/gu) || [];
  if (!letters.length) return 0;
  const ar = letters.filter((c) => /[؀-ۿ]/.test(c)).length;
  return ar / letters.length;
}

/** مشاكل جودة شائعة في نص طالع من موديل */
export function textProblems(text, { arabic = true } = {}) {
  const out = [];
  const t = text.trim();
  if (t.length < 80) out.push(["broken", `النتيجة فاضية أو قصيرة جداً (${t.length} حرف)`]);
  if (arabic && t.length >= 80 && arabicRatio(t) < 0.35) out.push(["warn", "النتيجة طالعة إنجليزي في أداة عربي"]);
  if (/<\/?think>|<\|[a-z_]+\|>/i.test(t)) out.push(["warn", "النتيجة فيها كلام داخلي للموديل ظاهر للمستخدم"]);
  if (/(^|\n)\s*#{1,4}\s|\*\*[^*\n]{2,60}\*\*/.test(t)) out.push(["warn", "التنسيق مكسور: علامات # أو ** ظاهرة بدل العناوين والخط العريض"]);
  if (/عذراً،? (لا|مش) (أستطيع|اقدر|يمكنني)|I can(no|')t help|as an AI/i.test(t)) out.push(["warn", "الموديل رفض أو اعتذر بدل ما ينفّذ"]);
  // أدوات البرمجة بتتكلم عن undefined وNaN عادي، فالفحص ده للأدوات العربي بس
  if (arabic && /\bundefined\b|\bNaN\b|\[object Object\]/.test(t)) out.push(["broken", "النتيجة فيها كلام بايظ (undefined / NaN)"]);
  return out;
}

export async function shot(page, OUT, name) {
  const dir = path.join(OUT, "shots");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${name.replace(/[^\p{L}\p{N}-]+/gu, "_").slice(0, 80)}.jpg`);
  await page.screenshot({ path: file, type: "jpeg", quality: 60 }).catch(() => {});
  return path.relative(OUT, file);
}

/** يرجع رقم ثابت لكل يوم (عشان التناوب) */
export const dayNumber = () => Math.floor((Date.now() + 2 * 3600e3) / 86400e3);

/** يختار n عناصر من قايمة بالتناوب حسب اليوم (كل القايمة بتتغطى على كام يوم) */
export function rotate(list, n, day = dayNumber()) {
  if (list.length <= n) return [...list];
  const start = (day * n) % list.length;
  return Array.from({ length: n }, (_, i) => list[(start + i) % list.length]);
}
