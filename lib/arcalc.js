// منطق الحاسبات والتحويلات العربية (من غير واجهة، عشان يتجرب لوحده)

/* ============ الأرقام الهندية والعربية ============ */
const INDIC = "٠١٢٣٤٥٦٧٨٩";
const EASTERN = "۰۱۲۳۴۵۶۷۸۹";
export function latinDigits(s = "") {
  return String(s).replace(/[٠-٩]/g, (d) => INDIC.indexOf(d)).replace(/[۰-۹]/g, (d) => EASTERN.indexOf(d)).replace(/٫/g, ".").replace(/٬/g, ",");
}
/** يقرا رقم من نص المستخدم (يقبل الهندي والفواصل) أو NaN */
export function num(s) {
  const t = latinDigits(String(s ?? "")).replace(/[,،\s]/g, "");
  return t === "" ? NaN : Number(t);
}
export const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: d }) : "—");

/* ============ نسب مئوية ============ */
export const percentOf = (p, v) => (p / 100) * v;            // كام p% من v
export const whatPercent = (x, v) => (v === 0 ? NaN : (x / v) * 100); // x يمثل كام % من v
export const changePercent = (from, to) => (from === 0 ? NaN : ((to - from) / Math.abs(from)) * 100);

/* ============ الزكاة ============ */
export const NISAB_GOLD_GRAMS = 85;   // نصاب الذهب (عيار 24)
export const NISAB_SILVER_GRAMS = 595; // نصاب الفضة
export const ZAKAT_RATE = 0.025;

export function zakat({ cash = 0, gold = 0, silver = 0, trade = 0, owed = 0, debts = 0, basis = "gold", goldPrice = 0, silverPrice = 0 }) {
  const total = Math.max(0, cash + gold + silver + trade + owed - debts);
  const price = basis === "gold" ? goldPrice : silverPrice;
  const grams = basis === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS;
  const nisab = price > 0 ? price * grams : NaN;
  const reached = Number.isFinite(nisab) && total >= nisab;
  return { total, nisab, reached, due: reached ? total * ZAKAT_RATE : 0 };
}

/* ============ أجر الفريلانسر بالساعة ============ */
export function hourlyRate({ income, expenses = 0, hoursWeek, billablePct = 70, weeksOff = 4, taxPct = 0, buffer = 10 }) {
  const weeks = 52 - weeksOff;
  const billable = hoursWeek * weeks * (billablePct / 100); // ساعات تتحاسب في السنة
  if (!(billable > 0)) return null;
  const need = (income + expenses) * 12;
  const gross = need / (1 - taxPct / 100) * (1 + buffer / 100);
  const hour = gross / billable;
  return { hour, day: hour * 8, billableYear: billable, billableWeek: billable / weeks, yearly: gross };
}

/* ============ التاريخ الهجري ============ */
export const HIJRI_MONTHS = ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
export const GREG_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
export const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const hijriFmt = () => new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" });

/** ميلادي (سنة، شهر 1-12، يوم) ← هجري (أم القرى) */
export function toHijri(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  const p = Object.fromEntries(hijriFmt().formatToParts(date).map((x) => [x.type, x.value]));
  const out = { y: Number(p.year), m: Number(p.month), d: Number(p.day), weekday: WEEKDAYS[date.getUTCDay()] };
  return Number.isFinite(out.y) ? out : null;
}

/** هجري ← ميلادي: بندوّر حوالين التاريخ التقريبي لحد ما نلاقي اليوم المطابق */
export function fromHijri(hy, hm, hd) {
  if (hm < 1 || hm > 12 || hd < 1 || hd > 30) return null;
  const approxYear = Math.floor(hy * 0.970224 + 621.5709 + (hm - 1) / 12 * 0.97);
  const start = Date.UTC(approxYear, 0, 1, 12) - 40 * 86400000;
  for (let i = 0; i < 480; i++) {
    const t = new Date(start + i * 86400000);
    const h = toHijri(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
    if (h && h.y === hy && h.m === hm && h.d === hd) return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), weekday: WEEKDAYS[t.getUTCDay()] };
  }
  return null; // اليوم ده مش موجود (مثلاً 30 في شهر ناقص)
}

/* ============ الأرقام بالحروف ============ */
const ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
// [المفرد، المثنى، الجمع (3-10)، التمييز (11+)]
const SCALES = [null, ["ألف", "ألفان", "آلاف", "ألف"], ["مليون", "مليونان", "ملايين", "مليون"], ["مليار", "ملياران", "مليارات", "مليار"], ["تريليون", "تريليونان", "تريليونات", "تريليون"]];

function below1000(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts = [];
  if (h) parts.push(HUNDREDS[h]);
  if (r) {
    if (r < 20) parts.push(ONES[r]);
    else {
      const o = r % 10;
      const t = Math.floor(r / 10);
      parts.push(o ? `${ONES[o]} و${TENS[t]}` : TENS[t]);
    }
  }
  return parts.join(" و");
}

/** عدد صحيح (حتى 999 تريليون) بالحروف */
export function intToWords(n) {
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999_999_999) return "";
  if (n === 0) return "صفر";
  const groups = [];
  let rest = n;
  while (rest > 0) { groups.push(rest % 1000); rest = Math.floor(rest / 1000); }
  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (!g) continue;
    if (i === 0) { parts.push(below1000(g)); continue; }
    const sc = SCALES[i];
    if (g === 1) parts.push(sc[0]);
    else if (g === 2) parts.push(sc[1]);
    else if (g <= 10) parts.push(`${below1000(g)} ${sc[2]}`);
    else parts.push(`${below1000(g)} ${sc[3]}`);
  }
  return parts.join(" و");
}

export const CURRENCIES = {
  none: null,
  egp: { one: "جنيه", two: "جنيهان", few: "جنيهات", many: "جنيهاً", sub: ["قرش", "قرشان", "قروش", "قرشاً"], subPer: 100 },
  sar: { one: "ريال", two: "ريالان", few: "ريالات", many: "ريالاً", sub: ["هللة", "هللتان", "هللات", "هللة"], subPer: 100 },
  usd: { one: "دولار", two: "دولاران", few: "دولارات", many: "دولاراً", sub: ["سنت", "سنتان", "سنتات", "سنتاً"], subPer: 100 },
  aed: { one: "درهم", two: "درهمان", few: "دراهم", many: "درهماً", sub: ["فلس", "فلسان", "فلوس", "فلساً"], subPer: 100 },
};

function counted(n, forms) {
  // [مفرد، مثنى، جمع، تمييز]
  if (n === 1) return forms[0];
  if (n === 2) return forms[1];
  const r = n % 100;
  const base = r >= 3 && r <= 10 ? forms[2] : forms[3];
  return `${intToWords(n)} ${base}`;
}

/** رقم بالحروف، ومعاه عملة اختيارية (صيغة الشيكات: «فقط ... لا غير») */
export function numberToWords(input, currency = "none", cheque = false) {
  const t = latinDigits(String(input)).replace(/[,،\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(t)) return "";
  const [ip, fp = ""] = t.split(".");
  if (ip.length > 15) return "";
  const whole = Number(ip);
  const cur = CURRENCIES[currency];
  let out;
  if (!cur) {
    out = intToWords(whole);
    if (fp) out += ` فاصلة ${[...fp].map((d) => (d === "0" ? "صفر" : ONES[Number(d)])).join(" ")}`;
  } else {
    const sub = Math.round(Number(`0.${fp || "0"}`) * cur.subPer);
    // التمييز بيتبع آخر العدد: 3-10 جمع، 11-99 مفرد منصوب، وقبل المئات والآلاف مفرد مجرور (مائة جنيه، ألف جنيه)
    const r = whole % 100;
    const main = whole === 0 && sub > 0 ? "" : whole === 1 ? cur.one : whole === 2 ? cur.two
      : r === 0 ? `${intToWords(whole).replace(/(مائتان|ألفان|مليونان|ملياران|تريليونان)$/, (m) => m.slice(0, -2) + "ا")} ${cur.one}`
      : `${intToWords(whole)} ${r >= 3 && r <= 10 ? cur.few : cur.many}`;
    const sp = sub > 0 ? counted(sub, cur.sub) : "";
    out = [main, sp].filter(Boolean).join(" و");
    if (!out) out = `صفر ${cur.many}`;
    if (cheque) out = `فقط ${out} لا غير`;
  }
  return out;
}

/* ============ النصوص ============ */
const TASHKEEL = /[ً-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;
export function cleanText(text, o = {}) {
  let t = String(text);
  if (o.tashkeel) t = t.replace(TASHKEEL, "");
  if (o.tatweel) t = t.replace(TATWEEL, "");
  if (o.digits) t = latinDigits(t);
  if (o.normalizeAlef) t = t.replace(/[أإآ]/g, "ا");
  if (o.hidden) t = t.replace(/[​-‏‪-‮⁦-⁩﻿]/g, "");
  if (o.spaces) t = t.replace(/[ \t ]+/g, " ").replace(/ *\n */g, "\n").trim();
  if (o.blank) t = t.replace(/\n{2,}/g, "\n");
  if (o.punct) t = t.replace(/\s+([،؛؟.,!:;])/g, "$1").replace(/([،؛؟,.!:;])(?=[^\s\d"')\]»،؛؟,.!:;])/g, "$1 ");
  return t;
}

const STOP = new Set("في من على عن الى إلى الي اللي ده دي دا هو هي انا انت احنا هم كان ما لا لم لن مش او أو و ثم كل بعض the a an of to in on for and or is are with".split(" "));
export function textStats(text) {
  const t = String(text);
  const words = t.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
  const sentences = (t.match(/[^.!؟?\n]+[.!؟?]*/g) || []).filter((s) => /[\p{L}\p{N}]/u.test(s));
  const paragraphs = t.split(/\n\s*\n|\n/).filter((p) => p.trim()).length;
  const freq = new Map();
  for (const w of words) {
    const k = w.replace(TASHKEEL, "").toLowerCase();
    if (k.length < 3 || STOP.has(k) || /^\d+$/.test(k)) continue;
    freq.set(k, (freq.get(k) || 0) + 1);
  }
  const top = [...freq.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return {
    words: words.length,
    chars: [...t].length,
    charsNoSpace: [...t.replace(/\s/g, "")].length,
    sentences: sentences.length,
    paragraphs,
    readMin: words.length / 180, // قراءة العربي ~180 كلمة في الدقيقة
    top: top.map(([w, c]) => ({ w, c, pct: (c / Math.max(1, words.length)) * 100 })),
  };
}

/* ============ كلمات المرور ============ */
export function genPassword({ length = 16, lower = true, upper = true, digits = true, symbols = true, ambiguous = false }) {
  let sets = [];
  const drop = (s) => (ambiguous ? s : s.replace(/[Il1O0o]/g, ""));
  if (lower) sets.push(drop("abcdefghijklmnopqrstuvwxyz"));
  if (upper) sets.push(drop("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
  if (digits) sets.push(drop("0123456789"));
  if (symbols) sets.push("!@#$%^&*-_=+?");
  sets = sets.filter(Boolean);
  if (!sets.length) return { pw: "", bits: 0 };
  const all = sets.join("");
  const rnd = (n) => {
    // اختيار عشوائي بدون انحياز (rejection sampling) من مولّد المتصفح الآمن
    const max = Math.floor(0x100000000 / n) * n;
    const a = new Uint32Array(1);
    do crypto.getRandomValues(a); while (a[0] >= max);
    return a[0] % n;
  };
  const chars = sets.map((s) => s[rnd(s.length)]); // حرف على الأقل من كل نوع
  while (chars.length < length) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = rnd(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return { pw: chars.slice(0, length).join(""), bits: Math.round(length * Math.log2(all.length)) };
}
