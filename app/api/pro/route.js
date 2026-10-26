// التأكد من كود الاشتراك (للموديلات العالمية). الأكواد في PRO_CODES في إعدادات Vercel.
import { validProCode, proOpen } from "@/lib/botcatalog";
import { clientIp, rateLimiter } from "@/lib/groq";

const tooMany = rateLimiter(15); // منع تجربة أكواد كتير ورا بعض

export async function POST(req) {
  if (tooMany(clientIp(req))) return Response.json({ ok: false, error: "محاولات كتير. جرّب بعد ساعة." }, { status: 429 });
  let body = {};
  try { body = await req.json(); } catch {}
  const ok = validProCode(body.code);
  return Response.json({ ok, open: proOpen() }, { status: ok ? 200 : 401 });
}
