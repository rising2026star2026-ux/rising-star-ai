// جمع بيانات السوق للباحث التجاري (على السيرفر بس)
// بحث في الإنترنت عن الأسعار والتكاليف + المنافسين من الخرائط + التضخم من صندوق النقد + تطبيقات متجر أبل للشركات الناشئة.
import { completeOnce, quickChain } from "@/lib/groq";
import { extractJson } from "@/lib/llmjson";
import { webSearchFull } from "@/lib/websearch";
import { TYPES } from "@/lib/feasibility";

const clip = (t = "", n = 400) => {
  const s = String(t).replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n)}…` : s;
};
const year = () => new Date().getFullYear();

/** أسئلة البحث: ثابتة لكل نوع + أسئلة خاصة بالنشاط من النموذج السريع */
async function planQueries(f) {
  const where = [f.area, f.city || f.governorate].filter(Boolean).join(" ");
  const gov = f.governorate || "مصر";
  const base = [
    `تكلفة فتح مشروع ${f.activity} في مصر ${year()}`,
    `سعر إيجار ${f.type === "warehouse" ? "مخزن" : f.type === "factory" ? "ورشة أو مصنع صغير" : "محل"} ${where || gov}`,
    `أسعار معدات وتجهيزات ${f.activity} مصر`,
    `مرتبات العمال في ${f.activity} مصر ${year()}`,
  ];
  if (f.type === "startup") base.push(`أسعار تصميم موقع وتطبيق ${f.activity} مستقل خمسات`);
  if (f.type === "factory") base.push(`أسعار خامات ${f.activity} مصر`);
  if (f.type === "warehouse") base.push(`سعر تخزين المتر في الشهر مصر ${year()}`);

  let extra = [];
  const text = await completeOnce(quickChain()[0], {
    messages: [
      { role: "system", content: 'انت باحث سوق مصري. رجّع JSON بس: {"q":["…","…"]} فيه سؤالين بحث قصيرين بالعربي (6 كلمات أو أقل) عن أسعار بيع منتج المشروع للعميل في مصر وتكلفة خاماته أو بضاعته. من غير أي كلام تاني.' },
      { role: "user", content: `المشروع: ${f.activity} (${TYPES[f.type]?.label || ""}) في ${gov}` },
    ],
    temperature: 0.2,
    maxTokens: 200,
  }).catch(() => "");
  const j = text ? extractJson(text) : null;
  if (Array.isArray(j?.q)) extra = j.q.map((q) => clip(q, 90)).filter(Boolean).slice(0, 2);
  return [...base, ...extra].slice(0, 7);
}

/** المنافسين من خرائط جوجل (محتاج SERPER_API_KEY) */
async function competitors(f) {
  const key = process.env.SERPER_API_KEY;
  if (!key) return { list: [], note: "المنافسين من الخرائط محتاجين مفتاح SERPER_API_KEY." };
  const q = [f.activity, f.area, f.city || f.governorate].filter(Boolean).join(" ");
  try {
    const r = await fetch("https://google.serper.dev/places", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q, gl: "eg", hl: "ar" }),
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) return { list: [], note: `الخرائط ردت بـ ${r.status}.` };
    const d = await r.json();
    const list = (d.places || []).slice(0, 12).map((p) => ({
      name: clip(p.title, 80),
      rating: Number(p.rating) || null,
      reviews: Number(p.ratingCount) || 0,
      address: clip(p.address, 120),
      category: clip(p.category, 60),
      price: clip(p.priceLevel || "", 20),
    }));
    return { list, note: list.length ? "" : "مالقيتش منافسين على الخرائط بالاسم ده." };
  } catch (e) {
    return { list: [], note: "الخرائط ماردتش." };
  }
}

/** التضخم المتوقع لمصر من صندوق النقد الدولي (من غير مفتاح) */
export async function inflation() {
  try {
    const r = await fetch("https://www.imf.org/external/datamapper/api/v1/PCPIPCH/EGY", { signal: AbortSignal.timeout(7000) });
    if (!r.ok) return null;
    const d = await r.json();
    const v = d?.values?.PCPIPCH?.EGY || {};
    const y = year();
    const pickYear = [y, y + 1, y - 1].find((k) => Number.isFinite(Number(v[k])));
    if (!pickYear) return null;
    return { value: Math.round(Number(v[pickYear]) * 10) / 10, year: pickYear, url: "https://www.imf.org/external/datamapper/PCPIPCH@WEO/EGY" };
  } catch {
    return null;
  }
}

/** تطبيقات منافسة في متجر أبل مصر (للشركات الناشئة، من غير مفتاح) */
async function appStore(f) {
  if (f.type !== "startup") return [];
  try {
    const u = `https://itunes.apple.com/search?${new URLSearchParams({ term: f.activity, country: "eg", entity: "software", limit: "8" })}`;
    const r = await fetch(u, { signal: AbortSignal.timeout(7000) });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.results || []).map((a) => ({
      name: clip(a.trackName, 80),
      seller: clip(a.sellerName, 60),
      rating: Number(a.averageUserRating) ? Math.round(a.averageUserRating * 10) / 10 : null,
      reviews: Number(a.userRatingCount) || 0,
      price: a.formattedPrice || "",
      url: a.trackViewUrl,
    }));
  } catch {
    return [];
  }
}

/**
 * كل البيانات مرة واحدة.
 * بيرجّع { sources:[{n,title,url,snippet,q}], notes:[…ملخصات بحث جوجل لو موجودة], competitors, compNote, inflation, apps, queries }
 */
export async function gatherMarket(f) {
  const queries = await planQueries(f);
  const [searches, comp, infl, apps] = await Promise.all([
    Promise.all(queries.map((q) => webSearchFull(q).catch(() => ({ results: [] })))),
    competitors(f),
    inflation(),
    appStore(f),
  ]);
  const sources = [];
  const notes = [];
  searches.forEach((res, i) => {
    if (res.notes) notes.push({ q: queries[i], text: clip(res.notes, 1800) });
    for (const r of (res.results || []).slice(0, 4)) {
      if (!r.url || sources.some((s) => s.url === r.url) || sources.length >= 24) continue;
      sources.push({ n: sources.length + 1, title: clip(r.title || r.domain || "مصدر", 120), url: r.url, snippet: clip(r.snippet, 420), q: queries[i] });
    }
  });
  if (infl) sources.push({ n: sources.length + 1, title: `صندوق النقد الدولي: التضخم المتوقع لمصر ${infl.year}`, url: infl.url, snippet: `${infl.value}٪`, q: "التضخم" });
  return { sources, notes, competitors: comp.list, compNote: comp.note, inflation: infl, apps, queries };
}
