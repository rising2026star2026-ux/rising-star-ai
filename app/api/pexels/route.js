// بحث فيديوهات Pexels (مجاني). المفتاح PEXELS_API_KEY في Vercel. بنرجّع روابط الملفات بس، والفيديو بيتحمّل من Pexels مباشرة.
import { fail, clientIp, rateLimiter } from "@/lib/groq";

export const maxDuration = 15;
const tooMany = rateLimiter(200);

function pickFile(files = []) {
  const mp4 = files.filter((f) => f.file_type === "video/mp4" && f.link);
  // عايزين فيديو حجمه معقول للموبايل (حوالي 720 أو أقل) عشان التحميل والتصدير يبقوا سريعين
  const ok = mp4.filter((f) => (f.width || 0) <= 1080 && (f.height || 0) <= 1920);
  const pool = ok.length ? ok : mp4;
  pool.sort((a, b) => Math.abs((a.width || 0) - 720) - Math.abs((b.width || 0) - 720));
  return pool[0] || null;
}

export async function GET(req) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return Response.json({ error: "no_key" }, { status: 503 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  const n = Math.min(6, Math.max(1, parseInt(url.searchParams.get("n"), 10) || 3));
  if (!q) return fail("اكتب كلمة البحث.", 400);
  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي. جرّب بعد شوية.", 429);
  try {
    const r = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=portrait&size=medium&per_page=${n + 3}`, {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 429) return Response.json({ error: "pexels_limit" }, { status: 429 });
    if (!r.ok) return Response.json({ error: "pexels_error" }, { status: 502 });
    const data = await r.json();
    const items = [];
    for (const v of data.videos || []) {
      const f = pickFile(v.video_files);
      if (!f || (v.duration || 0) < 3) continue;
      items.push({ id: v.id, url: f.link, thumb: v.image, duration: v.duration, page: v.url, by: v.user?.name || "", byUrl: v.user?.url || "" });
      if (items.length >= n) break;
    }
    return Response.json({ items }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return Response.json({ error: "pexels_error" }, { status: 502 });
  }
}
