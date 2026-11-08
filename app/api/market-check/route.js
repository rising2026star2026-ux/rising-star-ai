// «منتجي هيبيع؟» للسوق المصري: بيجيب ليستنجات حقيقية من أمازون مصر ونون وجوميا وتسوق جوجل في مصر،
// والأرقام (الأسعار والتقييمات والمؤشر) بتتحسب في الكود. الموديل دوره يفلتر الليستنجات اللي مش نفس المنتج،
// ويشرح النتيجة بكلام مفهوم من الأرقام دي بس، ومع كل معلومة رقم مصدرها.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { runMarketCheck } from "@/lib/marketcheck";
import { withSection } from "@/lib/sectionkeys";

export const maxDuration = 60;
const tooMany = rateLimiter(10); // 10 فحص في الساعة لكل زائر (كل فحص = 4 طلبات بحث)

const n = (v, lo, hi) => {
  const x = Math.round(Number(String(v ?? "").replace(/[^\d.]/g, "")));
  return Number.isFinite(x) && x >= lo && x <= hi ? x : null;
};

async function handlePost(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const product = String(body.product || "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (product.length < 3) return fail("اكتب اسم المنتج الأول، مثلاً: «سماعة بلوتوث لاسلكية».", 400);
  const channel = body.channel === "facebook" ? "facebook" : "marketplace";
  const price = n(body.price, 5, 2_000_000);
  const cost = n(body.cost, 1, 2_000_000);
  const shipping = n(body.shipping, 0, 100_000);
  const feePct = n(body.feePct, 1, 40);

  if (!process.env.SERPER_API_KEY) return fail("فحص السوق هيتفعّل قريب.", 503);
  if (tooMany(clientIp(req))) return fail("فحصت كتير الساعة دي. جرّب بعد شوية.", 429);

  const out = await runMarketCheck({ product, channel, price, cost, shipping, feePct, signal: req.signal });
  if (out.empty) return Response.json({ product: out.product, channel: out.channel, empty: true, note: out.note });
  return Response.json(out);
}

export const POST = withSection("seller", handlePost);
