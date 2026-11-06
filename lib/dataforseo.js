// حجم البحث على جوجل في مصر (بيانات Google Ads عن طريق DataForSEO) — على السيرفر بس.
// بيشتغل لما DATAFORSEO_LOGIN و DATAFORSEO_PASSWORD يتحطوا في Vercel.
// الطلب الواحد بيتحاسب مرة واحدة سواء فيه كلمة ولا 1000، فبنبعت كل الكلمات في طلب واحد.
// البيانات شهرية، فبنحفظ النتيجة أسبوع.
const URL_LIVE = "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live";
const WEEK = 7 * 24 * 3600 * 1000;
const cache = new Map();

export const hasDataForSeo = () => !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);

// Google Ads بيرفض الرموز والإيموجي: بنسيب الحروف والأرقام والمسافات بس، 80 حرف و10 كلمات بالكتير
export function cleanKeyword(k) {
  const t = String(k || "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return t.split(" ").slice(0, 10).join(" ").slice(0, 80).trim();
}

const num = (v) => (v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null);

/**
 * keywords: مصفوفة كلمات بحث.
 * بيرجّع { keywords: [{ keyword, volume, cpc, competition, trend: [{y, m, v}] }], cost } أو null لو مش متاح.
 */
export async function searchVolumeEgypt(keywords, signal) {
  if (!hasDataForSeo()) return null;
  const list = [...new Set((keywords || []).map(cleanKeyword).filter((k) => k.length >= 2))].slice(0, 20);
  if (!list.length) return null;
  const key = list.slice().sort().join("|");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < WEEK) return hit.v;

  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64");
  try {
    const res = await fetch(URL_LIVE, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      // من غير لغة عشان نحسب اللي بيكتبوا عربي وإنجليزي الاتنين
      body: JSON.stringify([{ keywords: list, location_name: "Egypt" }]),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error("dataforseo http", res.status);
      return null;
    }
    const j = await res.json();
    const task = Array.isArray(j?.tasks) ? j.tasks[0] : null;
    if (j?.status_code !== 20000 || !task || task.status_code !== 20000) {
      console.error("dataforseo", j?.status_code, j?.status_message, task?.status_code, task?.status_message);
      return null;
    }
    const out = (Array.isArray(task.result) ? task.result : [])
      .filter((r) => r && r.keyword)
      .map((r) => ({
        keyword: String(r.keyword).slice(0, 80),
        volume: num(r.search_volume),
        cpc: num(r.cpc),
        competition: ["LOW", "MEDIUM", "HIGH"].includes(r.competition) ? r.competition : null,
        trend: (Array.isArray(r.monthly_searches) ? r.monthly_searches : [])
          .map((x) => ({ y: num(x?.year), m: num(x?.month), v: num(x?.search_volume) }))
          .filter((x) => x.y && x.m && x.v !== null)
          .sort((a, b) => a.y - b.y || a.m - b.m)
          .slice(-12),
      }))
      .sort((a, b) => (b.volume || 0) - (a.volume || 0));
    const v = { keywords: out, cost: num(task.cost) };
    cache.set(key, { t: Date.now(), v });
    if (cache.size > 300) cache.delete(cache.keys().next().value);
    return v;
  } catch (e) {
    if (e?.name !== "AbortError") console.error("dataforseo", String(e?.message || e));
    return null;
  }
}

/** اتجاه آخر 3 شهور مقارنة بالـ 3 اللي قبلهم (نسبة مئوية)، أو null لو البيانات مش كفاية */
export function trendChange(trend) {
  if (!Array.isArray(trend) || trend.length < 6) return null;
  const last = trend.slice(-3).reduce((a, x) => a + x.v, 0) / 3;
  const prev = trend.slice(-6, -3).reduce((a, x) => a + x.v, 0) / 3;
  if (!prev) return null;
  return Math.round(((last - prev) / prev) * 100);
}
