// الباحث العقاري: جمع البيانات (على السيرفر بس).
// 1) بحث في مواقع العقارات المصرية (عقار ماب، Property Finder، بيوت، نوي، دوبيزل) وأخبار السوق عن نفس المنطقة.
// 2) استخراج الأسعار والمساحات من نصوص النتايج بالكود، وحساب سعر المتر من العينات.
// 3) الخدمات القريبة من خرائط جوجل (عن طريق Serper)، والتضخم من صندوق النقد الدولي.
// احنا بناخد اللي ظاهر في نتايج البحث بس (عنوان ومقطع ورابط)، ومش بننسخ الإعلانات من المواقع نفسها.
import { webSearchFull } from "@/lib/websearch";
import { inflation } from "@/lib/marketdata";
import { stats, UNIT_TYPES } from "@/lib/realestate";

export const PORTALS = [
  { host: "aqarmap.com.eg", name: "عقار ماب" },
  { host: "propertyfinder.eg", name: "Property Finder" },
  { host: "bayut.eg", name: "بيوت" },
  { host: "nawy.com", name: "نوي" },
  { host: "dubizzle.com.eg", name: "دوبيزل" },
];

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toLatin = (s) => String(s || "").replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/[٬،](?=\d{3})/g, ",").replace(/٫/g, ".");
const toNum = (s) => Number(String(s).replace(/,/g, ""));

/** الأسعار في نص: «4,500,000 جنيه» أو «4.5 مليون» أو «EGP 4,500,000» */
export function findPrices(text) {
  const t = toLatin(text);
  const out = [];
  const push = (raw) => {
    const v = toNum(raw);
    // سنة زي 2026 مش سعر
    if (!String(raw).includes(",") && v >= 1990 && v <= 2040) return;
    out.push(v);
  };
  for (const m of t.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:مليون|million|mn\b)/gi)) {
    const v = Number(m[1].replace(",", ".")) * 1e6;
    if (v >= 1e5) out.push(v);
  }
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)M\b/g)) out.push(Number(m[1]) * 1e6);
  for (const m of t.matchAll(/(?:\bEGP|\bLE\b|ج\.?م\.?)\s*(\d{1,3}(?:,\d{3})+|\d{4,})/gi)) push(m[1]);
  for (const m of t.matchAll(/(\d{1,3}(?:,\d{3})+|\d{4,})\s*(?:جنيه|ج\.?م|\bEGP\b|\bLE\b)/gi)) push(m[1]);
  return [...new Set(out)].filter((v) => v >= 500 && v < 5e9);
}

/** المساحة بالمتر: «120 م²» أو «120 متر» أو «120 sqm» */
export function findAreas(text) {
  const t = toLatin(text);
  const out = [];
  for (const m of t.matchAll(/(\d{2,5})\s*(?:م²|م2|م\s?مربع|متر(?:\s?مربع)?|sq\.?\s?m|sqm|m²|m2)/gi)) {
    const v = Number(m[1]);
    if (v >= 20 && v <= 20000) out.push(v);
  }
  return [...new Set(out)];
}

/** سعر المتر لو مكتوب صريح: «سعر المتر 45,000» أو «45,000 جنيه للمتر» */
export function findPpm(text) {
  const t = toLatin(text);
  const out = [];
  for (const m of t.matchAll(/(?:سعر\s?المتر|المتر)[^\d]{0,40}(\d{1,3}(?:,\d{3})+|\d{4,6})/g)) out.push(toNum(m[1]));
  for (const m of t.matchAll(/(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:جنيه|ج\.?م|EGP|LE)?\s*(?:\/\s?م|للمتر|per\s?(?:sq\.?\s?m|sqm|meter|m2))/gi)) out.push(toNum(m[1]));
  return out.filter((v) => v >= 1500 && v <= 600000);
}

/** عينة من نص نتيجة بحث: سعر متر مباشر، أو سعر ÷ مساحة لو في النص سعر واحد ومساحة واحدة */
export function sampleFrom(text, mode = "sale") {
  const ppm = findPpm(text);
  if (mode === "sale" && ppm.length) return { ppm: ppm[0] };
  const prices = findPrices(text);
  const areas = findAreas(text);
  if (mode === "rent") {
    const r = prices.filter((v) => v >= 1000 && v <= 600000);
    return r.length ? { rent: r[0], area: areas[0] || null } : null;
  }
  const big = prices.filter((v) => v >= 2e5);
  if (big.length === 1 && areas.length === 1) {
    const v = big[0] / areas[0];
    if (v >= 1500 && v <= 600000) return { ppm: v, price: big[0], area: areas[0] };
  }
  return big.length ? { price: big[0], area: areas[0] || null } : null;
}

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const portalName = (u) => PORTALS.find((p) => hostOf(u).endsWith(p.host))?.name || hostOf(u);

function planQueries(f) {
  const where = [f.district, f.city].filter(Boolean).join(" ");
  const kind = UNIT_TYPES[f.type] || "شقة";
  const sale = f.mode !== "rent";
  const verb = sale ? "للبيع" : "للإيجار";
  const q = [
    `${kind} ${verb} ${where} سعر المتر`,
    `${kind} ${verb} ${where} site:aqarmap.com.eg`,
    `${kind} ${verb} ${where} site:propertyfinder.eg`,
    `${kind} ${verb} ${where} site:bayut.eg`,
    `${kind} ${verb} ${where} site:dubizzle.com.eg`,
  ];
  // لو بيشتري: نجيب كمان الإيجارات عشان العائد، وأخبار المنطقة
  if (sale) q.push(`${kind} للإيجار ${where} شهريا`);
  q.push(`أسعار العقارات ${where} ${new Date().getFullYear()}`);
  return q;
}

async function places(f) {
  const key = process.env.SERPER_API_KEY;
  if (!key) return { list: [], note: "الخدمات القريبة محتاجة مفتاح SERPER_API_KEY." };
  const where = [f.district, f.city].filter(Boolean).join(" ");
  const cats = [["مدارس", "مدرسة"], ["مستشفيات وعيادات", "مستشفى"], ["سوبر ماركت", "سوبر ماركت"], ["مواصلات", f.city?.includes("القاهرة") || f.city?.includes("الجيزة") ? "محطة مترو" : "موقف مواصلات"]];
  const res = await Promise.all(cats.map(async ([label, q]) => {
    try {
      const r = await fetch("https://google.serper.dev/places", {
        method: "POST",
        headers: { "X-API-KEY": key, "Content-Type": "application/json" },
        body: JSON.stringify({ q: `${q} ${where}`, gl: "eg", hl: "ar" }),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) return null;
      const d = await r.json();
      const items = (d.places || []).slice(0, 10);
      return { label, count: items.length, top: items.slice(0, 3).map((p) => String(p.title || "").slice(0, 60)).filter(Boolean) };
    } catch { return null; }
  }));
  return { list: res.filter(Boolean), note: "" };
}

/**
 * f = { mode, type, city, district, area, budget, purpose }
 * بيرجّع { sources, sale, rent, prices, places, inflation, notes }
 */
export async function gatherProperty(f) {
  const queries = planQueries(f);
  const [results, pl, infl] = await Promise.all([
    Promise.all(queries.map((q) => webSearchFull(q).catch(() => ({ results: [] })))),
    places(f),
    inflation(),
  ]);

  const sources = [];
  const seen = new Set();
  const saleSamples = [];
  const rentSamples = [];
  const priceSamples = [];
  const notes = [];
  const observations = [];
  results.forEach((r, i) => {
    const isRent = f.mode === "rent" || /للإيجار/.test(queries[i]);
    if (r.notes) notes.push(String(r.notes).slice(0, 1200));
    for (const x of (r.results || []).slice(0, 6)) {
      if (!x.url || seen.has(x.url)) continue;
      seen.add(x.url);
      const text = `${x.title || ""} ${x.snippet || ""}`;
      const n = sources.length + 1;
      const s = sampleFrom(text, isRent ? "rent" : "sale");
      sources.push({ n, title: String(x.title || hostOf(x.url)).slice(0, 160), url: x.url, snippet: String(x.snippet || "").slice(0, 360), site: portalName(x.url), kind: isRent ? "rent" : "sale" });
      if (!s) continue;
      if (s.price || s.rent) observations.push({ n, kind: isRent ? "rent" : "sale", v: s.rent || s.price, price: s.price || s.rent, area: s.area || null });
      if (s.ppm) saleSamples.push({ v: s.ppm, n });
      if (s.rent) rentSamples.push({ v: s.rent, n, area: s.area });
      if (s.price && !s.ppm) priceSamples.push({ v: s.price, n, area: s.area });
      if (sources.length >= 28) break;
    }
  });

  const pack = (list) => {
    const st = stats(list.map((x) => x.v));
    if (!st) return null;
    const src = [...new Set(list.filter((x) => x.v >= st.low * 0.8 && x.v <= st.high * 1.2).map((x) => x.n))].slice(0, 6);
    return { ...st, src };
  };

  return {
    queries,
    sources,
    sale: pack(saleSamples),
    rent: pack(rentSamples),
    prices: pack(priceSamples),
    places: pl.list,
    placesNote: pl.note,
    inflation: infl,
    notes: notes.join("\n\n").slice(0, 3500),
    observations,
  };
}
