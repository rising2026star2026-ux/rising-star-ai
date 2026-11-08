// وكيل التاجر: القواعد المشتركة بين الصفحة والسيرفر.
// الوكيل بيفهم المهمة ويختار الأدوات، والكود هو اللي بيرتّب الخطوات ويتأكد منها.
// كل الأرقام هنا (السعر المقترح، المكسب، نقطة التعادل، تغيّر الأسعار) بتتحسب في الكود من بيانات السوق الحقيقية.

/** خطوات الوكيل بالترتيب. art: المجسّم من public/cards */
export const STEPS = {
  market: { tool: "فحص السوق", art: "magnifying-glass-tilted-left", busy: "بيجيب أسعار المنافسين", done: "جاب أسعار المنافسين", sub: "أمازون مصر، نون، جوميا، وتسوق جوجل في مصر" },
  price: { tool: "حاسبة الربح", art: "abacus", busy: "بيحسب السعر والمكسب", done: "حسب السعر والمكسب", sub: "الأرقام محسوبة من الأسعار الحقيقية" },
  listing: { tool: "ليستنج أمازون", art: "memo", busy: "بيكتب الليستنج", done: "كتب الليستنج", sub: "عنوان ونقاط ووصف وكلمات بحث، بالعربي والإنجليزي" },
  posts: { tool: "باكدج الإعلان", art: "megaphone", busy: "بيكتب البوستات", done: "كتب البوستات", sub: "فيسبوك وإنستجرام وواتساب وتيك توك" },
  images: { tool: "استوديو الصور", art: "camera-with-flash", busy: "بيصمم صور الإعلان", done: "صمم صور الإعلان", sub: "من صورة منتجك نفسها، من غير ما يتغيّر شكله" },
};
export const ORDER = ["market", "price", "listing", "posts", "images"];
const WANTS = ["market", "listing", "posts", "images"];
const DIALECTS = ["egy", "fusha", "gulf"];

const toAscii = (s) => String(s ?? "").replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
const clip = (v, max) => String(v ?? "").replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, " ").replace(/[ \t]{2,}/g, " ").trim().slice(0, max);

/** رقم من رد الموديل، ومقبول بس لو التاجر كتبه فعلاً في طلبه (عشان ما يتخترعش سعر أو تكلفة) */
export function statedNumber(v, goal, lo, hi) {
  const x = Math.round(Number(toAscii(v).replace(/[^\d.]/g, "")));
  if (!Number.isFinite(x) || x < lo || x > hi) return null;
  const digits = toAscii(goal).replace(/(\d)[,،٬](?=\d{3}(\D|$))/g, "$1"); // 5,000 ← 5000
  return new RegExp(`(^|\\D)${x}(\\D|$)`).test(digits) ? x : null;
}

/**
 * من رد المخطط لخطة ثابتة يقدر الكود ينفذها.
 * o: رد الموديل. goal: طلب التاجر. hasPhoto: رفع صورة منتج. seenName: اسم المنتج من الصورة (لو فيه).
 */
export function normalizePlan(o, { goal, hasPhoto = false, seenName = "", brandDialect = "" } = {}) {
  if (!o || typeof o !== "object") return null;
  const product = clip(o.product, 80) || clip(seenName, 80);
  const details = clip(o.details, 1200);
  const channel = ["marketplace", "social", "both"].includes(o.channel) ? o.channel : "unknown";
  let wants = Array.isArray(o.wants) ? [...new Set(o.wants.filter((w) => WANTS.includes(w)))] : [];
  if (!wants.length) wants = ["market", "posts"];
  if (wants.includes("listing") && !wants.includes("market")) wants.push("market"); // الليستنج من غير ما نعرف السوق ناقص
  if (hasPhoto && !wants.includes("images")) wants.push("images");
  const stated = DIALECTS.includes(o.dialect) ? o.dialect : "";
  const brief = {
    understood: clip(o.understood, 300),
    product,
    details,
    channel,
    price: statedNumber(o.price, goal, 5, 5_000_000),
    cost: statedNumber(o.cost, goal, 1, 5_000_000),
    shipping: statedNumber(o.shipping, goal, 0, 100_000),
    feePct: statedNumber(o.feePct, goal, 1, 40),
    dialect: stated || (DIALECTS.includes(brandDialect) ? brandDialect : "egy"),
  };
  let ask = null;
  if (!product) ask = "product";
  else if (wants.includes("images") && !hasPhoto) ask = "photo";
  const steps = ORDER.filter((id) => (id === "price" ? wants.includes("market") : wants.includes(id)));
  if (!brief.understood && !product) return null;
  return { brief, steps, ask };
}

/** نص الأسئلة اللي الوكيل ممكن يسألها (سؤال واحد بس قبل ما يبدأ) */
export const ASKS = {
  product: "المنتج اسمه إيه بالظبط؟ اكتب الاسم زي ما العميل بيدوّر عليه.",
  photo: "علشان أصمم صور الإعلان محتاج صورة منتجك نفسه. ارفع صورة من موبايلك، أو كمّل من غير صور.",
};

const pct = (a, b) => (a && b ? Math.round(((b - a) / a) * 100) : null);

/**
 * التسعير والمكسب بالكود. stats من فحص السوق. كل الأرقام لكل قطعة بالجنيه.
 * القاعدة: سعر الدخول المقترح بين أرخص ربع في السوق والمتوسط.
 */
export function pricing(stats, { price = null, cost = null, shipping = null, feePct = null } = {}) {
  if (!stats?.priced || !stats.median) return null;
  const ship = shipping || 0;
  const fee = feePct || 0;
  const row = (label, p, mine = false) => {
    if (!p) return null;
    const out = { label, price: p, mine };
    if (cost) {
      out.net = Math.round(p - cost - ship - (p * fee) / 100);
      out.margin = Math.round((out.net / p) * 100);
    }
    return out;
  };
  const rows = [
    row("أرخص ربع في السوق", stats.p25),
    row("متوسط السوق", stats.median),
    row("أغلى ربع في السوق", stats.p75),
    price ? row("سعرك", price, true) : null,
  ].filter(Boolean);
  const breakEven = cost && fee < 100 ? Math.ceil((cost + ship) / (1 - fee / 100)) : null;
  const vsMedian = price ? pct(stats.median, price) : null;
  return {
    entry: { low: Math.min(stats.p25 || stats.median, stats.median), high: stats.median },
    rows,
    breakEven,
    vsMedian,
    missing: [!cost && "التكلفة عليك", !shipping && "الشحن", !feePct && "عمولة المنصة"].filter(Boolean),
  };
}

/** الفرق بين فحصين للسوق (لما التاجر يراجع الأسعار تاني) */
export function priceDiff(before, after) {
  if (!before || !after) return null;
  return {
    median: { from: before.median, to: after.median, pct: pct(before.median, after.median) },
    min: { from: before.min, to: after.min, pct: pct(before.min, after.min) },
    listings: { from: before.listings, to: after.listings },
  };
}

/** المهام المحفوظة على جهاز التاجر: بنشيل اللي ملوش لازمة عشان المساحة */
export const SAVE_KEY = "seller-agent";
export const MAX_SAVED = 8;
export function compactRun(run) {
  const m = run.market && !run.market.empty
    ? {
        product: run.market.product, channel: run.market.channel, checkedAt: run.market.checkedAt,
        stats: run.market.stats, score: run.market.score, analysis: run.market.analysis,
        listings: (run.market.listings || []).slice(0, 12), dropped: run.market.dropped,
      }
    : run.market || null;
  return { id: run.id, t: run.t, goal: run.goal, brief: run.brief, steps: run.steps, market: m, listing: run.listing || null, posts: run.posts || null, history: run.history || [] };
}
