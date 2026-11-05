// Supabase من السيرفر (REST عن طريق PostgREST، من غير مكتبات). شغال بس لو SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY موجودين.
// لو مش موجودين كل الدوال بترجع من غير ما تعمل حاجة، والموقع يكمّل عادي.
// الجداول في supabase/realestate.sql.

const url = () => (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const hasSupabase = () => !!(url() && key());

async function rest(path, { method = "GET", body, prefer } = {}) {
  if (!hasSupabase()) return null;
  try {
    const r = await fetch(`${url()}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: key(),
        Authorization: `Bearer ${key()}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } catch {
    return null;
  }
}

/** بيسجّل العينات اللي اتجمعت من نتايج البحث كوحدات بدرجة ثقة D (سعر إعلان). نفس الرابط ما بيتكررش، والسعر الجديد بيتسجّل في السجل. */
export async function recordSamples(form, sources, samples) {
  if (!hasSupabase() || !samples?.length) return 0;
  const byN = Object.fromEntries((sources || []).map((s) => [s.n, s]));
  const rows = samples.slice(0, 30).map((x) => {
    const s = byN[x.n];
    if (!s?.url) return null;
    return {
      mode: x.kind === "rent" ? "rent" : "sale",
      unit_type: form.type || null,
      city: form.city || null,
      district: form.district || null,
      area_m2: x.area || null,
      price_total: x.price || (x.kind === "rent" ? x.v : null),
      source_url: s.url,
      source_kind: "portal",
      confidence: "D",
    };
  }).filter((r) => r && r.price_total);
  if (!rows.length) return 0;
  const out = await rest("units?on_conflict=source_url", { method: "POST", body: rows, prefer: "resolution=merge-duplicates,return=minimal" });
  return out ? rows.length : 0;
}

/** مؤشر المنطقة من قاعدة البيانات (آخر 90 يوم) لو فيه عينات كفاية */
export async function areaStats({ city, district, type, mode = "sale" }) {
  if (!hasSupabase()) return null;
  const q = new URLSearchParams({ select: "*", mode: `eq.${mode}` });
  if (city) q.set("city", `eq.${city}`);
  if (district) q.set("district", `eq.${district}`);
  if (type) q.set("unit_type", `eq.${type}`);
  const rows = await rest(`area_stats?${q}`);
  const r = rows?.[0];
  return r && Number(r.samples) >= 4 ? r : null;
}

export async function logUsage({ op, model = "", usd = 0, ipHash = "" }) {
  if (!hasSupabase()) return;
  await rest("usage", { method: "POST", body: [{ op, model, usd, ip_hash: ipHash }], prefer: "return=minimal" });
}
