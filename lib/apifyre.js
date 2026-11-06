// إعلانات العقارات المصرية من Apify (على السيرفر بس).
// الفكرة: Task في Apify بيشغّل أداة «Egyptian Real Estate Scraper» (عقار ماب، Property Finder، Dubizzle) كل يوم بجدول،
// والموقع بيقرا نتايج آخر تشغيل ناجح بطلب واحد سريع. كده الشات ما بيستناش السحب، وما بيعديش حد الـ 60 ثانية.
// بيشتغل لما APIFY_TOKEN و APIFY_RE_TASK (رقم أو اسم الـ Task، أو أكتر من واحد بفاصلة) يتحطوا في Vercel.
const SIX_HOURS = 6 * 3600 * 1000;
let memo = { t: 0, items: null };

export const hasApifyRe = () => !!(process.env.APIFY_TOKEN && process.env.APIFY_RE_TASK);

const numOf = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "object") return numOf(v.value ?? v.amount ?? v.price ?? null);
  const n = Number(String(v).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const SITE_NAMES = [[/aqarmap/i, "عقار ماب"], [/propertyfinder/i, "Property Finder"], [/dubizzle|olx/i, "دوبيزل"], [/nawy/i, "نوي"], [/bayut/i, "بيوت"]];

// أسماء الحقول مش موحدة بين المواقع، فبندوّر عليها بالاسم
function pick(obj, re, test) {
  for (const [k, v] of Object.entries(obj || {})) {
    if (!re.test(k)) continue;
    const n = numOf(v);
    if (n !== null && (!test || test(n))) return n;
  }
  return null;
}
function text(obj, re) {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    if (!re.test(k)) continue;
    if (typeof v === "string") out.push(v);
    else if (v && typeof v === "object" && !Array.isArray(v)) out.push(...Object.values(v).filter((x) => typeof x === "string"));
  }
  return out.join(" ").slice(0, 400);
}

/** إعلان واحد بشكل موحد، أو null لو مفيهوش سعر ولا رابط */
export function normalize(raw) {
  if (!raw || typeof raw !== "object") return null;
  const url = [raw.url, raw.link, raw.listingUrl, raw.detailUrl].find((u) => typeof u === "string" && /^https?:\/\//.test(u)) || "";
  if (!url) return null;
  const ppm = pick(raw, /per.?(sq|meter|metre|m2|sqm)|ppm|pricePerSquare/i, (n) => n >= 1500 && n <= 600000);
  const price = pick(raw, /^(price|priceEgp|price_egp|priceValue|amount|totalPrice|salePrice|rentPrice)$/i, (n) => n >= 1000 && n < 5e9)
    ?? pick(raw, /price/i, (n) => n >= 1000 && n < 5e9 && n !== ppm);
  const area = pick(raw, /^(area|size|sqm|builtUpArea|areaSqm|area_sqm|propertySize)$/i, (n) => n >= 20 && n <= 20000)
    ?? pick(raw, /area|size/i, (n) => n >= 20 && n <= 20000);
  if (!price && !ppm) return null;
  const kind = /rent|ايجار|إيجار/i.test(text(raw, /listingType|purpose|offerType|type|category/i)) ? "rent" : "sale";
  let site = text(raw, /^(platform|source|site|portal)$/i);
  if (!site) { try { site = new URL(url).hostname.replace(/^www\./, ""); } catch {} }
  site = SITE_NAMES.find(([re]) => re.test(site) || re.test(url))?.[1] || site;
  return {
    url,
    title: String(raw.title || raw.name || raw.headline || "").slice(0, 160),
    where: text(raw, /location|address|district|city|^area$|area_?name|neighbo|compound|region|governorate|title/i).toLowerCase(),
    site: String(site).slice(0, 40),
    kind,
    price: kind === "rent" ? null : price,
    rent: kind === "rent" ? price : null,
    area,
    ppm: kind === "sale" ? ppm ?? (price && area ? Math.round(price / area) : null) : null,
  };
}

/** كل الإعلانات من آخر تشغيل ناجح للـ Task (محفوظة 6 ساعات) */
export async function apifyListings(signal) {
  if (!hasApifyRe()) return [];
  if (memo.items && Date.now() - memo.t < SIX_HOURS) return memo.items;
  // ممكن أكتر من Task (منطقة لكل واحد) مفصولين بفاصلة
  const tasks = process.env.APIFY_RE_TASK.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8);
  const runs = await Promise.all(tasks.map(async (t) => {
    const url = `https://api.apify.com/v2/actor-tasks/${encodeURIComponent(t)}/runs/last/dataset/items?status=SUCCEEDED&clean=true&format=json&limit=3000`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}` },
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000),
      });
      if (!res.ok) {
        console.error("apify re", t, res.status);
        return null;
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      if (e?.name !== "AbortError") console.error("apify re", t, String(e?.message || e));
      return null;
    }
  }));
  if (runs.every((r) => r === null)) return memo.items || [];
  const seen = new Set();
  const items = runs.flat().filter(Boolean).map(normalize).filter((x) => x && !seen.has(x.url) && seen.add(x.url));
  memo = { t: Date.now(), items };
  return items;
}

// أسماء المناطق بالعربي والإنجليزي (زي ما بتظهر في الإعلانات)
const AREAS = [
  [/التجمع|القاهرة الجديدة|new cairo|tagamo|fifth settlement|5th settlement/i, ["new cairo", "new-cairo", "التجمع", "القاهرة الجديدة", "fifth settlement", "5th settlement", "tagamo"]],
  [/زايد|zayed/i, ["sheikh zayed", "sheikh-zayed", "zayed", "زايد"]],
  [/أكتوبر|اكتوبر|october/i, ["6th of october", "october", "أكتوبر", "اكتوبر"]],
  [/الساحل|العلمين|north coast|sahel/i, ["north coast", "north-coast", "sahel", "الساحل", "العلمين", "alamein"]],
  [/العاصمة|new capital/i, ["new capital", "administrative capital", "العاصمة"]],
  [/مدينتي|madinaty/i, ["madinaty", "مدينتي"]],
  [/الشروق|shorouk/i, ["shorouk", "الشروق"]],
  [/السخنة|sokhna/i, ["sokhna", "السخنة"]],
  [/الغردقة|hurghada/i, ["hurghada", "الغردقة"]],
  [/الإسكندرية|اسكندرية|إسكندرية|alexandria/i, ["alexandria", "الإسكندرية", "اسكندرية"]],
  [/المعادي|maadi/i, ["maadi", "المعادي"]],
  [/مدينة نصر|nasr city/i, ["nasr city", "مدينة نصر"]],
  [/المستقبل|mostakbal/i, ["mostakbal", "المستقبل"]],
];

/** إعلانات المنطقة اللي في سؤال المستخدم (بيع أو إيجار)، أو [] لو مفيش منطقة معروفة في السؤال */
export async function apifyForQuery(q, rent, signal) {
  const hit = AREAS.find(([re]) => re.test(q));
  if (!hit) return [];
  const all = await apifyListings(signal);
  const kind = rent ? "rent" : "sale";
  return all.filter((x) => x.kind === kind && hit[1].some((a) => x.where.includes(a)));
}
