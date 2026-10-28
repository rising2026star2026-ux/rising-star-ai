// كاشف النصب: بيفحص موقع البائع وصفحته فعلياً ويرجّع تقرير بالأدلة (شوف lib/scamscan.js)
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { scan, summarize, normalizeUrl } from "@/lib/scamscan";

const tooMany = rateLimiter(12); // 12 فحص في الساعة لكل زائر
export const maxDuration = 60;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const input = {
    url: typeof body.url === "string" ? body.url.slice(0, 500) : "",
    fb: typeof body.fb === "string" ? body.fb.slice(0, 500) : "",
    name: typeof body.name === "string" ? body.name.slice(0, 120) : "",
    offer: typeof body.offer === "string" ? body.offer.slice(0, 4000) : "",
    image: typeof body.image === "string" && /^data:image\/(png|jpe?g|webp);base64,/.test(body.image) && body.image.length < 3_000_000 ? body.image : "",
  };
  if (!input.url && !input.fb && !input.name && !input.offer && !input.image) return fail("حط لينك الموقع أو الصفحة أو اسم البائع.", 400);
  if (input.url && !normalizeUrl(input.url)) return fail("لينك الموقع مش مظبوط. انسخه من المتصفح زي ما هو.", 400);
  if (tooMany(clientIp(req))) return fail("وصلت لحد الفحص الساعة دي. جرّب بعد شوية.", 429);

  const result = await scan(input, req.signal);
  const text = await summarize(result, req.signal).catch(() => null);
  return Response.json({ ...result, summary: text?.summary || null, advice: text?.advice || [] });
}
