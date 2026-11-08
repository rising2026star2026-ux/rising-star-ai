// «دوّر على عقار»: بحث في مواقع الإعلانات العقارية المصرية كلها في نفس اللحظة، وتحويل النتايج لكروت.
// كل رقم في الكارت (السعر، المقدم، المساحة، الأوض، سعر المتر) متاخد من نص نتيجة البحث نفسها بالكود، مش من الموديل.
// بنعرض اللي ظاهر في نتايج البحث بس (عنوان ومقطع وصورة مصغرة لو موجودة) ورابط للإعلان الأصلي، ومش بننسخ الإعلانات.
import { PORTALS, portalOf } from "@/lib/portals";
import { searchProvider, webSearchFull } from "@/lib/websearch";

const MAX_CARDS = 10;

// نفس جملة البحث في خلال 20 دقيقة = من غير طلب جديد (الاقتراحات الجاهزة بتتكرر كتير)
// النتيجة الفاضية بتتحفظ 3 دقايق بس (ممكن تكون مهلة مؤقتة مش «مفيش إعلانات»)
const TTL = 20 * 60 * 1000, TTL_EMPTY = 3 * 60 * 1000, WAIT = 6500;
const cache = new Map();
const none = () => ({ results: [], images: [] });
async function cachedSearch(q) {
  const key = `${searchProvider()}|${q}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < (hit.v.results.length ? TTL : TTL_EMPTY)) return hit.v;
  // موقع واحد بطيء ما يأخرش الرد كله
  const v = await Promise.race([webSearchFull(q).catch(none), new Promise((r) => setTimeout(() => r(null), WAIT))]);
  if (!v) return none();
  const clean = { results: v.results || [], images: v.images || [] };
  if (cache.size >= 300) cache.delete(cache.keys().next().value);
  cache.set(key, { t: Date.now(), v: clean });
  return clean;
}

const PROPERTY = /(شق[ةه]|شقق|فيلا|فيلل|فلل|دوبلكس|بنتهاوس|روف|تاون\s?هاوس|توين\s?هاوس|شاليه|استوديو|ستوديو|محل|محلات|مكتب|مكاتب|عياد[ةه]|أرض|ارض|وحد[ةه]|عقار|عمار[ةه]|بيت|منزل|كمبوند|كومباوند|للبيع|للإيجار|للايجار|إيجار|ايجار|تمليك|أوض|اوض|غرف|غرف[ةه]|متر|م²|مليون|ميزاني|مقدم|قسط|تقسيط|apartment|villa|duplex|chalet|studio|penthouse|for sale|for rent)/i;
/** الرسالة فيها طلب عقار (نوع وحدة، بيع/إيجار، مساحة، ميزانية)؟ */
export const wantsListings = (t) => PROPERTY.test(String(t || ""));
export const isRent = (t) => /(إيجار|ايجار|rent)/i.test(String(t || ""));

const AR = "٠١٢٣٤٥٦٧٨٩";
const latin = (s) => String(s || "").replace(/[٠-٩]/g, (d) => String(AR.indexOf(d))).replace(/[٬،](?=\d{3})/g, ",").replace(/٫/g, ".");
const num = (s) => Number(String(s).replace(/,/g, ""));
// الرقم ده مقدم أو تأمين، أو قسط، مش سعر الوحدة؟ (بنبص على الكلام اللي قبله على طول)
const DOWN_BEFORE = /(down\s*payment|deposit|مقدم|المقدم|تأمين)[^\d]{0,14}$/i;
const INST_BEFORE = /(installments?|monthly|quarterly|قسط|أقساط|اقساط|شهري|ربع\s?سنوي)[^\d]{0,14}$/i;

/** كل الأسعار في النص بترتيب ظهورها، وكل واحد معلَّم لو كان مقدم (down) أو قسط (inst) */
export function pricesIn(text) {
  const t = latin(text);
  const out = [];
  const add = (i, v) => {
    if (!Number.isFinite(v) || v < 500 || v >= 5e9) return;
    if (out.some((x) => Math.abs(x.i - i) < 4)) return;
    const before = t.slice(Math.max(0, i - 30), i);
    out.push({ i, v, down: DOWN_BEFORE.test(before), inst: INST_BEFORE.test(before) });
  };
  for (const m of t.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:مليون|million|mn\b)/gi)) add(m.index, Number(m[1].replace(",", ".")) * 1e6);
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s?M\b/g)) add(m.index, Number(m[1]) * 1e6);
  for (const m of t.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:ألف|الف)(?!\s*متر)/g)) add(m.index, Number(m[1].replace(",", ".")) * 1e3);
  for (const m of t.matchAll(/(?:\bEGP|\bLE\b|ج\.?\s?م\.?)\s*(\d{1,3}(?:,\d{3})+|\d{4,})/gi)) add(m.index, num(m[1]));
  for (const m of t.matchAll(/(\d{1,3}(?:,\d{3})+|\d{4,})\s*(?:جنيه|ج\.?\s?م|\bEGP\b|\bLE\b)/gi)) add(m.index, num(m[1]));
  return out.sort((a, b) => a.i - b.i);
}

export function areaIn(text) {
  const m = latin(text).match(/(\d{1,3}(?:,\d{3})+|\d{2,5})\s*(?:م²|م2|م\s?مربع|متر(?:\s?مربع)?|sq\.?\s?m\.?|sqm|m²|m2)(?![a-z])/i);
  const v = m ? num(m[1]) : null;
  return v && v >= 20 && v <= 20000 ? v : null;
}

export function roomsIn(text) {
  const t = latin(text);
  const m = t.match(/(\d{1,2})\s*(?:bed(?:room)?s?\b|br\b|غرف(?:ة)?|أوض(?:ة)?|اوض(?:ة)?|حجرات|حجرة)/i) || t.match(/(?:غرف|أوض|اوض)\s*(\d{1,2})\b/);
  const v = m ? Number(m[1]) : null;
  return v && v >= 1 && v <= 12 ? v : null;
}

const TYPES = [
  [/تاون\s?هاوس|town\s?(house|villa)/i, "تاون هاوس"],
  [/توين\s?هاوس|twin\s?house/i, "توين هاوس"],
  [/دوبلكس|duplex/i, "دوبلكس"],
  [/بنتهاوس|penthouse/i, "بنتهاوس"],
  [/شاليه|chalet/i, "شاليه"],
  [/فيلا|فيلل|فلل|villa/i, "فيلا"],
  [/استوديو|ستوديو|studio/i, "استوديو"],
  [/شق[ةه]|شقق|apartment|\bflat\b/i, "شقة"],
  [/محل\b|محل تجاري|\bshop\b|retail/i, "محل"],
  [/مكتب|office/i, "مكتب"],
  [/عياد[ةه]|clinic/i, "عيادة"],
  [/قطعة\s?أرض|أرض\s?(?:للبيع|سكني|فضاء|زراعي)|\bland\b|\bplot\b/i, "أرض"],
];
export const typeIn = (text) => TYPES.find(([re]) => re.test(text))?.[1] || "";

// صفحة إعلان واحد ولا صفحة نتايج فيها إعلانات كتير؟
const ONE_LISTING = /\/(listing|plp|ad|property)\/|details-\d+\.html|-ID\d+\.html/i;
// عناوين بعض نتايج البحث بتطلع اسم صورة أو رقم بدل عنوان الإعلان
const JUNK_TITLE = /^(details?\b|screenshot|whatsapp|img[\s_-]|image\b|photo[\s_-]|\d{5,})|\.(jpe?g|png|webp)\b/i;

function cleanTitle(title, snippet) {
  let t = String(title || "").replace(/\s*[|\-–—]\s*(?:bayut|aqarmap|property\s?finder|nawy|dubizzle|olx|بيوت|عقار ماب|دوبيزل|نوي).*$/i, "").replace(/\s+/g, " ").trim();
  t = t.replace(/\s\d{6,}$/, "");
  if (t.length < 8 || JUNK_TITLE.test(t)) {
    const s = String(snippet || "")
      .replace(/\d+\s*%\s*down payment|down payment:?|off-plan|ready to move|\d+\s*(?:bed|bath)(?:room)?s?\b|(?:egp|le)\s?[\d,]+|[\d,]+\s*(?:sq\.?\s?m\.?|sqm|sq\.?\s?ft|sqft)/gi, " ")
      .replace(/(^|\s)\d{1,3}(?=\s|$)/g, " ")
      .replace(/\s+/g, " ").trim();
    t = s.split(/[.!؟?\n|]/).map((x) => x.trim()).find((x) => x.length >= 12) || s;
  }
  return t.slice(0, 110);
}

const RENT_WORDS = /(للإيجار|للايجار|إيجار|ايجار|for rent|\/rent\/|-for-rent)/i;
const SALE_WORDS = /(للبيع|for sale|\/buy\/|-for-sale|\/for-sale\/)/i;
/** الإعلان مكتوب فيه بيع ولا إيجار؟ (null لو مش واضح) */
function kindOf(r) {
  const x = `${r.title || ""} ${r.url || ""} ${r.snippet || ""}`;
  const isR = RENT_WORDS.test(x), isS = SALE_WORDS.test(x);
  return isR && !isS ? "rent" : isS && !isR ? "sale" : null;
}

function toCard(r, portal, images, wantRent) {
  const kind = kindOf(r);
  // إعلان إيجار في بحث شرا (أو العكس) مالوش لازمة للزائر
  if (kind && kind !== (wantRent ? "rent" : "sale")) return null;
  const rent = wantRent;
  const text = `${r.title || ""} ${r.snippet || ""}`;
  const prices = pricesIn(text);
  const main = rent
    ? prices.find((p) => !p.down && p.v >= 1000 && p.v <= 1e6)
    : prices.find((p) => !p.down && !p.inst && p.v >= 1e5);
  const down = rent ? null : prices.find((p) => p.down && p.v >= 1e4 && (!main || p.v < main.v));
  const area = areaIn(text);
  const rooms = roomsIn(text);
  const img = images.find((x) => x.h === r.url)?.s || "";
  const card = {
    url: r.url,
    site: portal.name,
    title: cleanTitle(r.title, r.snippet),
    type: typeIn(r.title || "") || typeIn(r.snippet || ""),
    page: !ONE_LISTING.test(r.url),
    snippet: String(r.snippet || "").replace(/\s+/g, " ").slice(0, 240),
  };
  if (main) card[rent ? "rent" : "price"] = Math.round(main.v);
  if (down) card.down = Math.round(down.v);
  if (area) card.area = area;
  if (rooms) card.rooms = rooms;
  if (card.price && area) {
    const ppm = card.price / area;
    if (ppm >= 1500 && ppm <= 600000) card.ppm = Math.round(ppm);
  }
  if (/^https:\/\//.test(img) && img.length < 400) card.img = img;
  return card;
}

/**
 * بحث في كل المواقع: جملة بحث لكل موقع لو المزود بيدعم site: كويس (Serper)، وإلا جملة واحدة فيها المواقع كلها.
 * بيرجّع { cards: [{ n, url, site, title, type, page, price|rent, down, area, rooms, ppm, img, snippet }], searched: [أسماء المواقع] }
 */
export async function findListings(query, { rent = false } = {}) {
  const searched = PORTALS.map((p) => p.name);
  const q = String(query || "").replace(/\s+/g, " ").trim().slice(0, 160);
  if (!q) return { cards: [], searched };
  const plans = searchProvider() === "serper"
    ? PORTALS.map((p) => `${q} site:${p.host}`)
    : [`${q} (${PORTALS.map((p) => `site:${p.host}`).join(" OR ")})`];
  const lists = await Promise.all(plans.map((x) => cachedSearch(x).catch(() => ({ results: [], images: [] }))));

  const groups = new Map(PORTALS.map((p) => [p.host, []]));
  const seen = new Set();
  for (const { results = [], images = [] } of lists) {
    for (const r of results) {
      if (!r?.url || !/^https?:\/\//i.test(r.url) || seen.has(r.url)) continue;
      const p = portalOf(r.url, r.domain);
      if (!p) continue;
      seen.add(r.url);
      const card = toCard(r, p, images, rent);
      if (card) groups.get(p.host).push(card);
    }
  }
  // من كل موقع: الإعلانات اللي فيها سعر الأول، وبعدين بالتبادل بين المواقع عشان النتيجة متبقاش من موقع واحد
  const has = (c) => (c.price || c.rent ? 2 : 0) + (c.page ? 0 : 1);
  const sorted = [...groups.values()].map((g) => g.sort((a, b) => has(b) - has(a)));
  const cards = [];
  for (let i = 0; cards.length < MAX_CARDS; i++) {
    let added = false;
    for (const g of sorted) {
      if (g[i] && cards.length < MAX_CARDS) { cards.push(g[i]); added = true; }
    }
    if (!added) break;
  }
  return { cards: cards.map((c, i) => ({ n: i + 1, ...c })), searched };
}

const fmt = (n) => Math.round(n).toLocaleString("en-US");

/** الكروت في شكل يفهمه الموديل، مع القواعد. status: ok | empty | limit | skip */
export function listingsBlock({ status, cards = [], searched = [] }) {
  const sites = searched.join("، ");
  if (status === "skip") return "الرسالة دي مش طلب بحث عن وحدة، فدردش معاه عادي زي صاحبه. لو مناسب اسأله سؤال واحد بس يقرّبك من اللي عايزه (المنطقة أو الميزانية أو عدد الأوض). ما تذكرش إعلانات أو أسعار.";
  if (status === "limit") return "تنبيه: الزائر وصل لحد البحث في الساعة دي، فمفيش بحث جديد في المواقع. ما تذكرش أي إعلانات أو أسعار. قوله إن البحث يرجع بعد شوية، وكمّل معاه في تحديد طلبه بسؤال واحد.";
  if (!cards.length) return `دوّرنا دلوقتي في ${searched.length} مواقع (${sites}) وملقيناش إعلانات مطابقة. قوله كده بصراحة من غير ما تألف أي إعلان أو سعر، واقترح تغيير واحد (منطقة قريبة أو ميزانية أو نوع وحدة) واسأله سؤال واحد.`;
  const lines = cards.map((c) => {
    const f = [
      c.type && `النوع: ${c.type}`,
      c.price && `السعر: ${fmt(c.price)} جنيه`,
      c.rent && `الإيجار: ${fmt(c.rent)} جنيه`,
      c.down && `المقدم: ${fmt(c.down)} جنيه`,
      c.area && `المساحة: ${c.area} م²`,
      c.rooms && `الأوض: ${c.rooms}`,
      c.ppm && `سعر المتر: ${fmt(c.ppm)} جنيه`,
      c.page && "صفحة فيها إعلانات كتير (مش إعلان واحد)",
    ].filter(Boolean).join(" | ");
    return `[${c.n}] ${c.site}: ${c.title}${f ? `\n${f}` : ""}${c.snippet ? `\nمن الإعلان: ${c.snippet}` : ""}`;
  });
  const priced = cards.some((c) => c.price || c.rent);
  return [
    `دي نتايج البحث اللي لسه جايبينها من ${searched.length} مواقع (${sites}). الزائر شايف الكروت دي فوق ردك وعليها نفس الأرقام:`,
    lines.join("\n\n"),
    "قواعد الرد:",
    priced
      ? "- ابدأ بسطر «أحسن اختيار: [رقم]» وقول ليه في جملة (سعر، مساحة، مكان، سعر متر). بعدها قارن بسرعة مع اختيارين تانيين بأرقامهم."
      : "- مفيش أسعار واضحة في النتايج. قوله أنهي صفحة يبدأ منها [رقم] وليه، من غير ما تخمّن أسعار.",
    "- استخدم الأرقام اللي فوق بس. لو الإعلانات أغلى من ميزانيته، قوله لو زوّد كام يوصل لأنهي إعلان (من الأرقام دي)، أو «تعالى نبص على حاجة تانية» واقترح منطقة أو نوع.",
    "- ما تكررش كل تفاصيل الكروت، وما تكتبش روابط.",
  ].join("\n");
}
