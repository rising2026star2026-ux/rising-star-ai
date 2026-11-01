// «تحليل المنافس»: التاجر بيلصق ليستنج المنافس وتقييماته (إحنا مش بنسحب صفحات أمازون)،
// والاقتباسات في النتيجة بتتراجع بالكود على النص الملصوق، وأي اقتباس مش موجود بيتشال.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { runCompetitor } from "@/lib/amazonprompts";
import { marketKey, timedAsk, cleanText } from "@/lib/amazonapi";

export const maxDuration = 60;
const tooMany = rateLimiter(12);

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const listing = cleanText(body.listing, 4000);
  const reviews = cleanText(body.reviews, 9000);
  const mine = cleanText(body.mine, 2500);
  const market = marketKey(body.market);
  if (listing.length < 20) return fail("الصق عنوان ونقاط المنتج المنافس الأول.", 400);
  if (reviews.length < 80) return fail("الصق تقييمات عملاء المنافس (الأفضل السلبية والمتوسطة، 10 تقييمات على الأقل).", 400);
  if (tooMany(clientIp(req))) return fail("جرّبت كتير الساعة دي. استنى شوية وارجع تاني.", 429);

  const result = await runCompetitor({ listing, reviews, mine, market, ask: timedAsk(req) });
  if (!result) return fail("المحلل مشغول دلوقتي 😅 جرّب تاني بعد دقيقة.", 503);
  return Response.json({ ...result, market, reviewsLen: reviews.length });
}
