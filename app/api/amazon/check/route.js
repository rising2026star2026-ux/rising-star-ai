// «فاحص الرفض»: فحص ثابت بالكود لليستنج + اقتراح تصحيح من الموديل، والتصحيح نفسه بيتفحص تاني بالكود.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { runCheck } from "@/lib/amazonprompts";
import { marketKey, timedAsk, cleanText } from "@/lib/amazonapi";

export const maxDuration = 60;
const tooMany = rateLimiter(20);

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const input = {
    title: cleanText(body.title, 700),
    bullets: (Array.isArray(body.bullets) ? body.bullets : []).slice(0, 10).map((b) => cleanText(b, 1200)),
    description: cleanText(body.description, 4500),
    backend: cleanText(body.backend, 1200),
  };
  const market = marketKey(body.market);
  const opts = { market, brand: cleanText(body.brand, 60), titleMax: Number(body.titleMax) || undefined };
  if (!input.title && !input.bullets.some(Boolean) && !input.description) return fail("الصق عنوان الليستنج أو النقاط الأول.", 400);
  if (tooMany(clientIp(req))) return fail("جرّبت كتير الساعة دي. استنى شوية وارجع تاني.", 429);

  const result = await runCheck({ input, opts, ask: timedAsk(req) });
  // لو الموديل مش متاح، التاجر لسه بياخد الفحص الآلي (وده الأهم)
  return Response.json({ ...result, input, market });
}
