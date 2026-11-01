// «ليستنج من وصف عامي أو صورة»: عربي وإنجليزي، وكل ناتج بيتفحص بالكود قبل ما يوصل للتاجر.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { describeImage, DATA_IMAGE, MAX_IMAGE } from "@/lib/llmjson";
import { runListing } from "@/lib/amazonprompts";
import { marketKey, timedAsk, cleanText } from "@/lib/amazonapi";

export const maxDuration = 60;
const tooMany = rateLimiter(15);

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const desc = cleanText(body.desc, 2500);
  const brand = cleanText(body.brand, 60);
  const image = typeof body.image === "string" ? body.image : "";
  const langs = ["en", "ar", "both"].includes(body.langs) ? body.langs : "both";
  const market = marketKey(body.market);
  if (desc.length < 8 && !image) return fail("اكتب وصف المنتج بكلامك (جملة أو اتنين) أو ارفع صورته.", 400);
  if (image && (image.length > MAX_IMAGE || !DATA_IMAGE.test(image))) return fail("الصورة لازم تكون JPG أو PNG بحجم معقول.", 400);
  if (tooMany(clientIp(req))) return fail("جرّبت كتير الساعة دي. استنى شوية وارجع تاني.", 429);

  let photo = "";
  if (image) {
    photo = await describeImage(
      image,
      "ده منتج هيتباع على أمازون. اوصفه في نقاط قصيرة: 1) نوع المنتج بالظبط 2) اللون والخامة الظاهرة 3) العدد أو الأجزاء اللي باينة 4) أي كلام مكتوب على المنتج أو العبوة بالنص الحرفي (براند، مقاس، موديل) 5) شكل الاستخدام. ممنوع تخمّن حاجة مش باينة.",
      { signal: req.signal },
    );
    if (!photo && desc.length < 8) return fail("ما قدرناش نقرا الصورة. اكتب سطر عن المنتج وجرّب تاني.", 422);
  }

  const result = await runListing({ desc: desc || "(التاجر ما كتبش وصف، اعتمد على وصف الصورة)", photo, brand, market, langs, ask: timedAsk(req) });
  if (!result) return fail("الكاتب مشغول دلوقتي 😅 جرّب تاني بعد دقيقة.", 503);
  return Response.json({ ...result, market, sawImage: !!photo });
}
