// بيانات السوق المصري الحقيقية لأداة «منتجي هيبيع؟» (على السيرفر بس).
// كل الأرقام هنا بتيجي من نتايج جوجل في مصر (Serper، gl=eg) وبتتحسب في الكود، مش من خيال الموديل.
// المصادر: أمازون مصر، نون مصر، جوميا مصر، وتسوق جوجل في مصر.

const SERPER = "https://google.serper.dev";
const DAY = 24 * 3600 * 1000;

export const STORES = [
  { id: "amazon", name: "أمازون مصر", host: /(^|\.)amazon\.eg$/i, q: (p) => `${p} site:amazon.eg` },
  { id: "noon", name: "نون مصر", host: /(^|\.)noon\.com$/i, path: /\/egypt-/i, q: (p) => `${p} site:noon.com/egypt-ar` },
  { id: "jumia", name: "جوميا مصر", host: /(^|\.)jumia\.com\.eg$/i, q: (p) => `${p} site:jumia.com.eg` },
];

// نتايج البحث بتتحفظ يوم كامل: نفس المنتج ما يتدفعش عليه مرتين
const cache = new Map();
function cached(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < DAY) return hit.v;
  if (hit) cache.delete(key);
  return null;
}
function store(key, v) {
  cache.set(key, { t: Date.now(), v });
  if (cache.size > 400) cache.delete(cache.keys().next().value);
}

async function serper(path, body, signal) {
  const res = await fetch(`${SERPER}/${path}`, {
    method: "POST",
    headers: { "X-API-KEY": process.env.SERPER_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ gl: "eg", hl: "ar", ...body }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(14000)]) : AbortSignal.timeout(14000),
  });
  if (!res.ok) throw new Error(`serper ${path} ${res.status}`);
  return res.json();
}

// الأرقام العربية والفارسية → إنجليزي
const toLatin = (s) => String(s || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/٫/g, ".").replace(/٬/g, ",");

const CUR = "(?:EGP|E£|LE|L\\.E|ج\\.?\\s?م\\.?|جنيه(?:اً|ا)?|جنية)";
const NUM = "(\\d{1,3}(?:[,\\s]\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)";
const PRICE_RE = [new RegExp(`${CUR}\\s*${NUM}`, "i"), new RegExp(`${NUM}\\s*${CUR}`, "i")];

/** أول سعر بالجنيه في نص، أو null */
export function priceOf(text) {
  const t = toLatin(text);
  for (const re of PRICE_RE) {
    const m = re.exec(t);
    if (m) {
      const n = Number(m[1].replace(/[,\s]/g, ""));
      if (Number.isFinite(n) && n >= 5 && n <= 2_000_000) return Math.round(n);
    }
  }
  return null;
}

const num = (v) => {
  const n = Number(toLatin(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

// من 30 أكتوبر 2026 جوجل بيرجّع النتايج بعد أول 3 كرابط تحويل google.com/goto?url=... مش الرابط الحقيقي.
// الرابط ده بيفتح عادي في المتصفح، بس ما نقدرش نعرف منه المتجر ولا نوع الصفحة.
export function isGoto(link) {
  try {
    const u = new URL(link);
    return /(^|\.)google\.[a-z.]+$/i.test(u.hostname) && u.pathname === "/goto";
  } catch {
    return false;
  }
}

function storeOf(link) {
  try {
    const u = new URL(link);
    return STORES.find((s) => s.host.test(u.hostname) && (!s.path || s.path.test(u.pathname)))?.id || null;
  } catch {
    return null;
  }
}

/** صفحة منتج ولا صفحة قسم/بحث؟ (صفحات الأقسام مش بنحسب سعرها) */
function isProductPage(store, link) {
  try {
    const p = new URL(link).pathname;
    if (store === "amazon") return /\/(dp|gp\/product)\//i.test(p);
    if (store === "noon") return /\/p\/?$|\/p\//i.test(p) || /\/[A-Z0-9]{8,}\/p/i.test(p);
    if (store === "jumia") return /\.html$/i.test(p) && !/\/catalog\//i.test(p);
  } catch {}
  return false;
}

/**
 * بيجمع ليستنجات المنتج من المتاجر المصرية وتسوق جوجل في مصر.
 * بيرجّع { items, errors } — كل item: { n, title, link, store, storeName, price, rating, reviews }
 */
export async function collectListings(product, signal) {
  const key = product.toLowerCase().replace(/\s+/g, " ").trim();
  const hit = cached(key);
  if (hit) return { ...hit, cached: true };

  const errors = [];
  const jobs = [
    ...STORES.map((s) => serper("search", { q: s.q(product), num: 10 }, signal).then((d) => ({ kind: "search", d, store: s.id })).catch((e) => { errors.push(String(e.message || e)); return null; })),
    serper("shopping", { q: product, num: 20 }, signal).then((d) => ({ kind: "shopping", d })).catch((e) => { errors.push(String(e.message || e)); return null; }),
  ];
  const out = await Promise.all(jobs);

  const items = [];
  const seen = new Set();
  const push = (it) => {
    if (!it.link || seen.has(it.link)) return;
    seen.add(it.link);
    items.push(it);
  };

  for (const r of out) {
    if (!r) continue;
    if (r.kind === "search") {
      for (const o of r.d?.organic || []) {
        const text = [o.title, o.snippet, o.price, o.priceRange, ...(o.attributes ? Object.values(o.attributes) : [])].filter(Boolean).join(" ");
        // رابط goto: البحث كان مقفول على موقع المتجر (site:)، فالمتجر معروف. نوع الصفحة مش معروف،
        // فبناخدها بس لو فيها سعر (صفحات الأقسام غالباً من غير سعر، والموديل بيفلتر الباقي بعدها)
        const goto = isGoto(o.link);
        const st = goto ? r.store : storeOf(o.link);
        // صفحات الأقسام والبحث مش ليستنج حقيقي، فما بنحسبهاش في عدد المنافسين ولا الأسعار
        if (!st || (goto ? priceOf(text) == null : !isProductPage(st, o.link))) continue;
        push({
          title: String(o.title || "").slice(0, 160),
          link: o.link,
          store: st,
          price: priceOf(text),
          rating: num(o.rating),
          reviews: num(o.ratingCount),
        });
      }
    } else {
      for (const s of r.d?.shopping || []) {
        const src = String(s.source || "");
        const st = storeOf(s.link) || (/amazon/i.test(src) ? "amazon" : /noon/i.test(src) ? "noon" : /jumia/i.test(src) ? "jumia" : "other");
        push({
          title: String(s.title || "").slice(0, 160),
          link: s.link,
          store: st,
          source: src.slice(0, 60),
          price: priceOf(String(s.price || "")) ?? (num(s.price) && num(s.price) >= 5 ? Math.round(num(s.price)) : null),
          rating: num(s.rating),
          reviews: num(s.ratingCount),
        });
      }
    }
  }

  const names = Object.fromEntries(STORES.map((s) => [s.id, s.name]));
  items.forEach((it, i) => {
    it.n = i + 1;
    it.storeName = names[it.store] || it.source || "متجر في مصر";
  });
  const res = { items: items.slice(0, 60), errors };
  if (items.length) store(key, res);
  return res;
}

const median = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const quant = (s, q) => s[Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * q)))];

/** إحصائيات السوق من الليستنجات المطابقة (بتتحسب هنا، مش بالموديل) */
export function marketStats(items) {
  const priced = items.filter((i) => i.price);
  // نشيل الأسعار الشاذة (غالباً منتج مختلف أو باكدج كبير)
  let prices = priced.map((i) => i.price).sort((a, b) => a - b);
  if (prices.length >= 5) {
    const q1 = quant(prices, 0.25), q3 = quant(prices, 0.75), iqr = q3 - q1;
    prices = prices.filter((p) => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
  }
  const byStore = {};
  for (const it of items) {
    // المتاجر التانية من تسوق جوجل (B.TECH وغيرها) كل واحد لوحده
    const k = it.store === "other" ? `other:${it.storeName}` : it.store;
    const b = (byStore[k] ||= { store: k, name: it.storeName, listings: 0, prices: [], reviews: 0 });
    b.listings++;
    if (it.price && prices.includes(it.price)) b.prices.push(it.price);
    if (it.reviews) b.reviews += it.reviews;
  }
  const stores = Object.values(byStore).map((b) => ({
    store: b.store, name: b.name, listings: b.listings, reviews: b.reviews,
    min: b.prices.length ? Math.min(...b.prices) : null,
    median: median(b.prices),
    max: b.prices.length ? Math.max(...b.prices) : null,
  }));
  const rated = items.filter((i) => i.rating && i.reviews);
  const reviewsTotal = items.reduce((a, i) => a + (i.reviews || 0), 0);
  const topReviews = Math.max(0, ...items.map((i) => i.reviews || 0));
  return {
    listings: items.length,
    priced: prices.length,
    min: prices.length ? prices[0] : null,
    median: median(prices),
    max: prices.length ? prices[prices.length - 1] : null,
    p25: prices.length ? quant(prices, 0.25) : null,
    p75: prices.length ? quant(prices, 0.75) : null,
    reviewsTotal,
    topReviews,
    avgRating: rated.length ? Math.round((rated.reduce((a, i) => a + i.rating * i.reviews, 0) / rated.reduce((a, i) => a + i.reviews, 0)) * 10) / 10 : null,
    stores,
  };
}

/**
 * المؤشر: نقطة بداية 50، وكل عامل ليه وزن مكتوب، والمدى بيوسع لما البيانات تقل.
 * ده مؤشر تقديري من بيانات السوق، مش احتمال مبيعات مضمون.
 */
export function readiness({ stats, price, cost, shipping, feePct, channel, search }) {
  const factors = [];
  const add = (label, delta, why) => factors.push({ label, delta, why });

  // 0) البحث على جوجل في مصر (Google Ads عن طريق DataForSEO): أقوى إشارة للطلب لأنها ناس بتدوّر فعلاً
  if (search && Number.isFinite(search.volume)) {
    const v = search.volume;
    const f = v.toLocaleString("en");
    if (v >= 10000) add("البحث على جوجل", 12, `«${search.top}» بيتدوّر عليها حوالي ${f} مرة في الشهر في مصر`);
    else if (v >= 1000) add("البحث على جوجل", 7, `«${search.top}» بيتدوّر عليها حوالي ${f} مرة في الشهر في مصر`);
    else if (v >= 100) add("البحث على جوجل", 2, `«${search.top}» بيتدوّر عليها حوالي ${f} مرة في الشهر بس`);
    else add("البحث على جوجل", -6, v ? `«${search.top}» بيتدوّر عليها ${f} مرة بس في الشهر` : "مفيش بحث تقريباً على المنتج ده في مصر");
    if (Number.isFinite(search.change) && Math.abs(search.change) >= 15) {
      add("اتجاه البحث", search.change > 0 ? 3 : -3, `البحث ${search.change > 0 ? "زاد" : "قلّ"} ${Math.abs(search.change)}% في آخر 3 شهور عن اللي قبلهم`);
    }
  }

  // 1) الطلب: إجمالي التقييمات على المنتجات الشبيهة (كل تقييم = حد اشترى فعلاً)
  const r = stats.reviewsTotal;
  if (r >= 5000) add("الطلب في السوق", 15, `${r.toLocaleString("en")} تقييم على منتجات شبيهة: فيه ناس كتير بتشتري النوع ده`);
  else if (r >= 1000) add("الطلب في السوق", 10, `${r.toLocaleString("en")} تقييم على منتجات شبيهة: طلب واضح`);
  else if (r >= 150) add("الطلب في السوق", 4, `${r.toLocaleString("en")} تقييم على منتجات شبيهة: طلب متوسط`);
  else if (stats.listings >= 3) add("الطلب في السوق", -8, r ? `${r} تقييم بس على المنتجات الشبيهة: الطلب ضعيف أو جديد` : "مفيش تقييمات ظاهرة على المنتجات الشبيهة: الطلب مش واضح");

  // 2) السعر مقارنة بالسوق
  if (price && stats.median) {
    const d = (price - stats.median) / stats.median;
    const pct = Math.round(Math.abs(d) * 100);
    if (d <= -0.25) add("سعرك", 4, `أرخص من المتوسط بـ ${pct}%: جذاب، بس اتأكد إن الربح يستحمل`);
    else if (d <= -0.05) add("سعرك", 8, `أرخص من المتوسط بـ ${pct}%`);
    else if (d <= 0.1) add("سعرك", 5, "قريب من متوسط السوق");
    else if (d <= 0.3) add("سعرك", -7, `أغلى من المتوسط بـ ${pct}%: محتاج سبب واضح (جودة، ضمان، هدية)`);
    else add("سعرك", -15, `أغلى من المتوسط بـ ${pct}%: صعب تبيع من غير ميزة قوية جداً`);
  }

  // 3) المنافسة
  const n = stats.listings;
  if (channel === "marketplace") {
    if (n >= 40) add("المنافسة", -10, `${n} ليستنج لنفس النوع: هتحتاج صور وتقييمات قوية عشان تظهر`);
    else if (n >= 15) add("المنافسة", -4, `${n} ليستنج: منافسة متوسطة`);
    else if (n >= 3) add("المنافسة", 3, `${n} ليستنج بس: مساحة لبياع جديد`);
  } else {
    if (n >= 40) add("المنافسة", -6, `${n} عرض للمنتج في المتاجر: العميل هيقارن سعرك بيهم`);
    else if (n >= 3) add("المنافسة", 2, `${n} عرض في المتاجر: المنتج معروف ومش مزحوم`);
  }

  // 4) الجودة اللي العميل متعود عليها
  if (stats.avgRating && stats.avgRating < 3.8) add("رضا العملاء عن المنافسين", 5, `متوسط تقييم المنافسين ${stats.avgRating} من 5: لو جودتك أحسن عندك فرصة`);

  // 5) هامش الربح (لو العميل كتب التكلفة)
  if (price && cost) {
    const ship = shipping || 0;
    // عمولة المنصة بتختلف حسب القسم، فبناخدها من العميل ومش بنفترض رقم
    const fee = channel === "marketplace" && feePct ? (price * feePct) / 100 : 0;
    const net = price - cost - ship - fee;
    const m = net / price;
    const pct = Math.round(m * 100);
    const noFee = channel === "marketplace" && !feePct ? " (من غير عمولة المنصة، ضيفها عشان الحساب يبقى أدق)" : "";
    if (net <= 0) add("هامش الربح", -25, `بعد التكلفة${ship ? " والشحن" : ""}${fee ? ` وعمولة ${feePct}%` : ""} مفيش ربح${noFee}`);
    else if (m < 0.15) add("هامش الربح", -12, `الربح ${pct}% بس${channel === "facebook" ? "، وتكلفة الإعلان لسه ما اتخصمتش" : ""}${noFee}`);
    else if (m < 0.3) add("هامش الربح", 0, `الربح حوالي ${pct}%${channel === "facebook" ? " قبل الإعلانات" : ""}${noFee}`);
    else add("هامش الربح", 8, `الربح حوالي ${pct}%${channel === "facebook" ? " قبل الإعلانات" : ""}: فيه مساحة للإعلان والخصومات${noFee}`);
  }

  const raw = 50 + factors.reduce((a, f) => a + f.delta, 0);
  const mid = Math.max(5, Math.min(90, raw));
  // المدى: كل ما البيانات أقل، التقدير أوسع
  const hasSearch = search && Number.isFinite(search.volume);
  const evidence = Math.min(1, (stats.priced / 8) * (hasSearch ? 0.4 : 0.5) + (Math.min(stats.reviewsTotal, 1000) / 1000) * (hasSearch ? 0.2 : 0.3) + (Math.min(n, 15) / 15) * 0.2 + (hasSearch ? 0.2 : 0));
  const half = Math.round(25 - evidence * 15); // من ±10 لـ ±25
  return {
    low: Math.max(0, Math.round(mid - half)),
    high: Math.min(100, Math.round(mid + half)),
    mid: Math.round(mid),
    evidence: Math.round(evidence * 100),
    factors,
  };
}
