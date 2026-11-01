// أدوات أمازون: القواعد المشتركة بين الصفحات والسيرفر.
// الفحص هنا بالكود (مش بالذكاء الاصطناعي) عشان النتيجة تبقى ثابتة وتتكرر بنفس الشكل كل مرة.
// ملحوظة مهمة: أمازون ما بتنشرش قايمة رسمية كاملة بالكلمات الممنوعة، والقوايم هنا «كلمات شائعة بتسبب مشاكل»
// ومحتاجة مراجعة مع دليل التصنيف بتاعك في Seller Central. الفحص بيقلل احتمال الرفض، مش بيضمن القبول.

export const MARKETS = {
  eg: { label: "أمازون مصر", domain: "amazon.eg", cur: "جنيه" },
  sa: { label: "أمازون السعودية", domain: "amazon.sa", cur: "ريال" },
  ae: { label: "أمازون الإمارات", domain: "amazon.ae", cur: "درهم" },
};

export const LIMITS = {
  title: 200, // الحد العام من 21 يناير 2025، وبعض التصنيفات أقل (الملابس مثلاً)
  titleMobile: 80, // الموبايل بيعرض أول حوالي 80 حرف من العنوان
  bullet: 255, // الحد المعتاد للنقطة، بيختلف حسب التصنيف
  bulletCount: 5,
  description: 2000,
  backendBytes: 250, // كلمات البحث الخلفية بالبايت، والحرف العربي = 2 بايت
};

export const FIELD_LABEL = { title: "العنوان", bullet: "النقطة", description: "الوصف", backend: "كلمات البحث الخلفية" };
export const LEVEL_LABEL = { error: "خطر رفض", warn: "تحذير", tip: "تحسين" };

/* ---------------- أدوات نص ---------------- */
const AR_MARKS = /[ً-ٰٟـ]/g;
const toAsciiDigits = (s) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

/** توحيد الحروف العربية عشان المقارنة تبقى ثابتة (أ إ آ ← ا، ى ← ي، ة ← ه، وشيل التشكيل) */
export function normAr(s) {
  return toAsciiDigits(String(s || "")).replace(AR_MARKS, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
}

export const utf8Bytes = (s) => new TextEncoder().encode(String(s || "")).length;

/** بيقص النص لحد عدد بايتات معين من غير ما يقطع كلمة */
export function trimToBytes(text, max) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const out = [];
  for (const w of words) {
    if (utf8Bytes([...out, w].join(" ")) > max) break;
    out.push(w);
  }
  return out.join(" ");
}

const STOP = new Set([
  "a", "an", "the", "and", "or", "of", "for", "with", "in", "on", "to", "by", "at", "from", "&", "-", "x",
  "و", "في", "من", "علي", "الي", "مع", "عن", "او", "ب", "ل", "مع",
]);
const tokens = (s) =>
  normAr(s).toLowerCase().replace(/[()[\],.:/\\"'`’‘“”«»+&|-]/g, " ").split(/\s+/).filter((w) => w.length > 1);

/** أرقام موجودة في النص التاني ومش موجودة في الأول (عشان نكشف رقم الموديل اخترعه من عنده) */
export function newNumbers(original, fixed) {
  const grab = (t) => new Set((toAsciiDigits(String(t || "")).match(/\d+(?:[.,]\d+)?/g) || []).map((n) => n.replace(",", ".")));
  const a = grab(original);
  return [...grab(fixed)].filter((n) => !a.has(n));
}

/* ---------------- قوايم الكلمات ---------------- */
// كل قاعدة: re على النص الإنجليزي (lowercase)، أو ar على النص العربي بعد normAr
// level: error = بتسبب إخفاء أو رفض غالباً، warn = محتاجة تصريح أو إثبات أو خطر محتمل
const RULES = [
  { code: "shipping", level: "error", why: "معلومات الشحن ممنوعة في الليستنج", re: /\bfree\s+(shipping|delivery)\b/i, ar: /(شحن|توصيل)\s+(سريع\s+)?مجاني|مجاني\s+(شحن|توصيل)/ },
  { code: "bestseller", level: "error", why: "ادعاء «الأكثر مبيعاً» أو «رقم 1» ممنوع", re: /\b(best[\s-]?sell(er|ing)|top[\s-]?(rated|selling)|highest[\s-]?rated|number\s+one|world'?s\s+best)\b|(^|\s)(#|no\.?\s?)1\b/i, ar: /(الاكثر|الافضل)\s+مبيعا|رقم\s*1(?!\d)|رقم\s+واحد|الاول\s+(في|علي)\s+(مصر|السعوديه|الامارات|العالم|الوطن)|الاعلي\s+تقييم/ },
  { code: "price_claim", level: "error", why: "كلام عن السعر أو العروض ممنوع (الأسعار بتتحط في خانة السعر بس)", re: /\b(best|cheapest|lowest)\s+(price|deal)\b|\b(on\s+sale|big\s+sale|huge\s+sale|massive\s+sale|discount(ed)?|clearance|closeout|close-out|limited[\s-]time|limited\s+offer|special\s+offer|hot\s+(item|deal))\b/i, ar: /(افضل|ارخص|اقل)\s+سعر|الارخص|خصم|تخفيض|اوكازيون|تصفيه|عرض\s+(خاص|محدود)|لفتره\s+محدوده|سعر\s+(مخفض|خاص)/ },
  { code: "guarantee", level: "error", why: "ضمان الرضا أو استرجاع الفلوس ادعاء ممنوع في النص", re: /\b(100\s?%\s?(quality|satisfaction|guarantee\w*)|money[\s-]?back|satisfaction\s+guarantee\w*|guarantee[ds]?)\b/i, ar: /ضمان\s*100|100\s*%?\s*(ضمان|مضمون)|مضمون\s*100|ضمان\s+(استرجاع|استرداد)|استرداد\s+(الاموال|المبلغ)|رضا\s+العملاء\s*100/ },
  { code: "cta", level: "error", why: "عبارات «اشتري الآن» وشبهها ممنوعة", re: /\b(buy\s+now|add\s+to\s+cart|order\s+now|don'?t\s+miss)\b/i, ar: /(اشتري|اطلب)\s+الان|اضف\s+الي\s+السله|لا\s*تفوت|الكميه\s+محدوده|قبل\s+نفاذ/ },
  { code: "amazon_brand", level: "error", why: "ممنوع تنسب منتجك لأمازون (Amazon's Choice وشبهها)", re: /\bamazon'?s?\s+choice\b/i, ar: /اختيار\s+امازون/ },
  { code: "authentic", level: "warn", why: "ادعاء الأصالة محتاج إثبات وممكن يتفحص", re: /\b100\s?%\s?(authentic|original|genuine)\b/i, ar: /اصلي\s*100|100\s*%?\s*(اصلي|اورجينال|اوريجينال)|اورجينال\s*100/ },
  { code: "health", level: "warn", why: "الادعاءات العلاجية والصحية محتاجة تصريح، وبتسبب إيقاف المنتج كتير", re: /\b(cures?|cured|heals?|healing|anti-?bacterial|anti-?microbial|anti-?viral|kills?\s+(germs|bacteria|viruses)|fda[\s-]approved|clinically\s+(proven|tested)|detox\w*)\b/i, ar: /يعالج|يشفي|شفاء|مضاد\s+(للبكتيريا|للفيروسات|للجراثيم|للميكروبات)|يقضي\s+علي\s+(البكتيريا|الجراثيم|الحشرات|الفيروسات)|معتمد\s+من\s+(وزاره\s+الصحه|هيئه\s+الدواء)|مثبت\s+اكلينيكيا|ازاله\s+السموم|ديتوكس|حرق\s+الدهون/ },
  { code: "eco", level: "warn", why: "ادعاءات البيئة (صديق للبيئة، قابل للتحلل) محتاجة شهادات", re: /\b(eco[\s-]?friendly|biodegradable|compostable|non[\s-]?toxic)\b/i, ar: /صديق\s+للبيئه|قابل\s+للتحلل|غير\s+سام/ },
  { code: "unverifiable", level: "warn", why: "كلمة تفضيل بدون إثبات، أمازون بتعتبرها ادعاء مش مثبت", re: /\b(best|top[\s-]?quality|perfect|amazing|unbeatable|premium\s+quality)\b/i, ar: /(?:^|\s)(الافضل|الاحسن|مثالي|لا\s+مثيل\s+له|جوده\s+فائقه)(?=\s|$)/ },
];

const PRICE_RE = /(\d[\d.,]*\s?(egp|sar|aed|usd|le\b|جنيه|ريال|درهم|دولار)|[$€£]\s?\d)/i;
const CONTACT_RES = [
  [/https?:\/\/|www\.|\.(com|net|org|eg|sa)\b/i, "رابط أو موقع"],
  [/[\w.+-]+@[\w-]+\.\w{2,}/, "إيميل"],
  // lookbehind عشان رقم الباركود الطويل ما يتفهمش على إنه موبايل
  [/(?<![\d+])((\+?20|0)?1[0125]\d{8}|(\+?966|0)?5\d{8}|(\+?971|0)?5\d{8})(?!\d)/, "رقم موبايل"],
  [/whats\s?app|واتس\s?اب|واتساب|تليجرام|telegram|فيسبوك|facebook|instagram|انستجرام/i, "تواصل خارج أمازون"],
];
const TITLE_BAD = /[!$?_{}^¬¦™®©]/;
const TITLE_WARN = /[~*#<>|;]/;
const EMOJI = /\p{Extended_Pictographic}/u;

/** فحص شامل لليستنج. المدخلات: { title, bullets: [], description, backend } */
export function checkListing(input, opts = {}) {
  const title = String(input.title || "").trim();
  const bullets = (Array.isArray(input.bullets) ? input.bullets : []).map((b) => String(b || "").trim());
  const description = String(input.description || "").trim();
  const backend = String(input.backend || "").trim();
  const titleMax = Math.min(Math.max(Number(opts.titleMax) || LIMITS.title, 20), 200);
  const brand = String(opts.brand || "").trim();

  const issues = [];
  const seen = new Set();
  const add = (field, level, code, text, extra = {}) => {
    const key = `${field}|${extra.index ?? ""}|${code}|${extra.match ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    issues.push({ field, level, code, text, ...extra });
  };

  const textRules = (field, value, index) => {
    if (!value) return;
    const low = value.toLowerCase();
    const ar = normAr(value);
    for (const r of RULES) {
      const m = low.match(r.re) || ar.match(r.ar);
      if (m) {
        const hit = (m[0] || "").trim();
        // ادعاء «الأفضل» في الوصف مقبول أكتر من العنوان، فنخفف درجته
        const level = r.code === "unverifiable" && field !== "title" ? "tip" : r.level;
        add(field, level, r.code, r.why, { index, match: hit });
      }
    }
    if (PRICE_RE.test(value)) add(field, "error", "price_in_text", "السعر مكتوب جوه النص، ممنوع. السعر بيتحط في خانة السعر بس.", { index, match: (value.match(PRICE_RE) || [""])[0] });
    for (const [re, label] of CONTACT_RES) {
      const m = value.match(re);
      if (m) add(field, "error", "contact", `فيه ${label} جوه النص، وأمازون بتمنع التواصل خارج المنصة.`, { index, match: m[0] });
    }
    if (EMOJI.test(value)) add(field, "error", "emoji", "الإيموجي والرموز التزيينية ممنوعة في الليستنج.", { index, match: (value.match(EMOJI) || [""])[0] });
  };

  /* ===== العنوان ===== */
  if (!title) {
    add("title", "error", "title_empty", "العنوان فاضي.");
  } else {
    if (title.length > titleMax) add("title", "error", "title_len", `العنوان ${title.length} حرف، والحد ${titleMax}. الزيادة ممكن توقف ظهوره في البحث.`, { value: title.length, limit: titleMax });
    if (title.length < 20) add("title", "tip", "title_short", `العنوان قصير (${title.length} حرف). حط نوع المنتج وأهم ميزة فيه.`);
    if (title.length > LIMITS.titleMobile && title.length <= titleMax) {
      add("title", "tip", "title_mobile", `الموبايل بيقص العنوان عند حوالي ${LIMITS.titleMobile} حرف، فخلّي أهم المعلومات قبل: «…${title.slice(Math.max(0, LIMITS.titleMobile - 18), LIMITS.titleMobile)}»`);
    }
    const bad = title.match(TITLE_BAD);
    if (bad) add("title", "error", "title_chars", "فيه رموز ممنوعة في العنوان حسب دليل أمازون (! $ ? _ { } ^ ™ ® ©).", { match: bad[0] });
    const warnCh = title.match(TITLE_WARN);
    if (warnCh) add("title", "warn", "title_chars2", "رمز زي (~ * # < > | ;) بيتمنع في أغلب التصنيفات. شيله لو مش ضروري.", { match: warnCh[0] });
    if (/؟/.test(title)) add("title", "warn", "title_chars3", "علامة الاستفهام ممنوعة في العنوان، وده يشمل «؟».", { match: "؟" });

    const counts = new Map();
    for (const w of tokens(title)) {
      if (STOP.has(w) || /^\d+([.,]\d+)?$/.test(w)) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
    }
    for (const [w, n] of counts) if (n > 2) add("title", "error", "title_repeat", `كلمة «${w}» متكررة ${n} مرات. أمازون بتسمح بمرتين بس (غير حروف الجر).`, { match: w });

    const caps = (title.match(/\b[A-Z]{4,}\b/g) || []).filter((w) => !/^(USB|HDMI|LED|WIFI|HDR|RGB|NFC|AMOLED|BLUETOOTH)$/.test(w));
    if (caps.length >= 2) add("title", "warn", "title_caps", "كلمات إنجليزي كلها حروف كبيرة. اكتبها Title Case (أول حرف كبير بس).", { match: caps.slice(0, 3).join(" ") });
    const lat = title.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w) && !STOP.has(w.toLowerCase()));
    if (lat.length >= 3 && lat.filter((w) => /^[a-z]/.test(w)).length / lat.length > 0.4) add("title", "tip", "title_case", "الكلمات الإنجليزي في العنوان يفضل يبدأ كل منها بحرف كبير.");
    if (brand && !title.toLowerCase().includes(brand.toLowerCase()) && !normAr(title).includes(normAr(brand))) add("title", "tip", "title_brand", `اسم البراند «${brand}» مش موجود في العنوان.`);
    textRules("title", title);
  }

  /* ===== النقاط ===== */
  const filled = bullets.filter(Boolean);
  if (filled.length === 0) add("bullet", "warn", "bullets_none", "مفيش نقاط مميزات. النقاط من أهم أسباب إقناع المشتري.");
  else if (filled.length < LIMITS.bulletCount) add("bullet", "tip", "bullets_few", `فيه ${filled.length} نقاط بس، وأمازون بتنصح بـ${LIMITS.bulletCount}.`);
  const bulletSeen = new Map();
  bullets.forEach((b, i) => {
    if (!b) return;
    if (b.length > LIMITS.bullet) add("bullet", "warn", "bullet_len", `النقطة ${i + 1} طولها ${b.length} حرف، والمعتاد لحد ${LIMITS.bullet} (بيختلف حسب التصنيف).`, { index: i });
    if (b.length < 25) add("bullet", "tip", "bullet_short", `النقطة ${i + 1} قصيرة (${b.length} حرف). وضّح الفايدة للمشتري.`, { index: i });
    if (/^[a-z]/.test(b)) add("bullet", "tip", "bullet_case", `النقطة ${i + 1} تبدأ بحرف صغير. ابدأ كل نقطة بحرف كبير.`, { index: i });
    const key = normAr(b).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(); // \W كانت بتمسح الحروف العربية كلها
    if (bulletSeen.has(key)) add("bullet", "warn", "bullet_dup", `النقطة ${i + 1} مكررة من النقطة ${bulletSeen.get(key) + 1}.`, { index: i });
    else bulletSeen.set(key, i);
    textRules("bullet", b, i);
  });

  /* ===== الوصف ===== */
  if (description) {
    if (description.length > LIMITS.description) add("description", "error", "desc_len", `الوصف ${description.length} حرف، والحد ${LIMITS.description}.`);
    textRules("description", description);
  } else {
    add("description", "tip", "desc_empty", "مفيش وصف. الوصف بيكمل المعلومات اللي مش داخلة في النقاط.");
  }

  /* ===== كلمات البحث الخلفية ===== */
  if (backend) {
    const bytes = utf8Bytes(backend);
    if (bytes > LIMITS.backendBytes) add("backend", "error", "backend_len", `الكلمات الخلفية ${bytes} بايت، والحد ${LIMITS.backendBytes}. الحرف العربي بيحسب بايتين، وممكن أمازون تتجاهل الحقل كله لو عدّى الحد.`, { value: bytes, limit: LIMITS.backendBytes });
    if (/[,،;]/.test(backend)) add("backend", "tip", "backend_commas", "مش محتاج فواصل في الكلمات الخلفية، المسافة تكفي وبتوفر مساحة.");
    const inTitle = new Set(tokens(title).filter((w) => !STOP.has(w)));
    const dup = [...new Set(tokens(backend))].filter((w) => inTitle.has(w));
    if (dup.length >= 3) add("backend", "tip", "backend_dup", `كلمات موجودة في العنوان وبتتكرر هنا (${dup.slice(0, 4).join("، ")}). مفيش فايدة من تكرارها، استغل المساحة في كلمات جديدة.`);
    textRules("backend", backend);
  }

  const order = { error: 0, warn: 1, tip: 2 };
  issues.sort((a, b) => order[a.level] - order[b.level]);

  const count = (l) => issues.filter((x) => x.level === l).length;
  const stats = {
    titleLen: title.length,
    titleMax,
    bulletLens: bullets.map((b) => b.length),
    descLen: description.length,
    backendBytes: utf8Bytes(backend),
    errors: count("error"),
    warns: count("warn"),
    tips: count("tip"),
  };
  // مفيش «ناجح»: الفحص ده مش بيضمن قبول أمازون، فالنتيجة اتنين بس: فيه مشاكل واضحة أو مفيش مشاكل ظاهرة
  const status = stats.errors > 0 ? "blocked" : stats.warns > 0 ? "risky" : "clean";
  return { issues, stats, status };
}

/* ---------------- حاسبة الربح ---------------- */
const num = (v) => {
  const n = Number(toAsciiDigits(String(v ?? "")).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * كل الأرقام بنفس العملة. الحساب لكل وحدة.
 * price: سعر البيع للمشتري. vatPct: نسبة الضريبة، vatIncluded: هل السعر شامل الضريبة.
 * refPct: عمولة أمازون %. fulfil: رسوم الشحن والتجهيز للوحدة (FBA أو شحنك). buy + inbound: التكلفة الواصلة.
 * adsMode: "pct" (نسبة من السعر) أو "flat" (مبلغ للوحدة). returnsPct: نسبة المرتجع (تقدير متحفظ: المرتجع بيتخسر بالكامل).
 */
export function computeProfit(raw) {
  const price = num(raw.price);
  const vat = num(raw.vatPct);
  const vatIncluded = raw.vatIncluded !== false;
  const ref = num(raw.refPct);
  const fulfil = num(raw.fulfil);
  const buy = num(raw.buy);
  const inbound = num(raw.inbound);
  const other = num(raw.other);
  const adsPct = raw.adsMode === "flat" ? 0 : num(raw.ads);
  const adsFlat = raw.adsMode === "flat" ? num(raw.ads) : 0;
  const ret = num(raw.returnsPct) / 100;
  const target = num(raw.targetMargin) / 100;

  const landed = buy + inbound;
  const vatShare = vatIncluded && vat > 0 ? vat / (100 + vat) : 0; // حصة الضريبة من السعر
  const solve = (p) => {
    const vatAmt = p * vatShare;
    const net = p - vatAmt;
    const referral = p * (ref / 100);
    const ads = p * (adsPct / 100) + adsFlat;
    const returns = ret * (landed + fulfil);
    const profit = net - referral - fulfil - landed - ads - returns - other;
    return { price: p, net, vatAmt, referral, ads, returns, fulfil, other, profit, margin: net > 0 ? profit / net : 0, roi: landed > 0 ? profit / landed : 0 };
  };

  const fixed = fulfil + landed + other + adsFlat + ret * (landed + fulfil);
  const varShare = vatShare + ref / 100 + adsPct / 100; // نسبة بتروح من كل جنيه بيع
  const breakEven = 1 - varShare > 0 ? fixed / (1 - varShare) : Infinity;
  const forTarget = target > 0 && 1 - varShare - target * (1 - vatShare) > 0 ? fixed / (1 - varShare - target * (1 - vatShare)) : null;

  return {
    ok: price > 0 && landed > 0,
    base: solve(price),
    breakEven: Number.isFinite(breakEven) ? breakEven : null,
    forTarget,
    landed,
    scenarios: [0.9, 1, 1.1].map((k) => ({ k, ...solve(price * k) })),
    missing: [
      !ref && "عمولة أمازون",
      !fulfil && "رسوم الشحن والتجهيز",
      !raw.ads && "تكلفة الإعلانات",
      !raw.returnsPct && "نسبة المرتجع",
    ].filter(Boolean),
  };
}
