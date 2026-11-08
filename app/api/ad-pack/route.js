// «باكدج الإعلان»: من معلومات المنتج (أو كلام البياع في فويس) بيكتب كل اللي محتاجه عشان ينشر:
// بوست فيسبوك، كابشن إنستجرام، رسالة واتساب، سكريبت تيك توك، وصف للمتجر، عناوين، هاشتاجات، وشعار ومميزات للفيديو.
// بيستخدمه «صوّرها بموبايلك» و«اتكلم واحنا نكتب».
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { str } from "@/lib/llmjson";
import { cleanBrand } from "@/lib/brandprofile";
import { runAdPack, DIALECTS } from "@/lib/adpack";
import { withSection } from "@/lib/sectionkeys";

export const maxDuration = 60;
const tooMany = rateLimiter(25);

async function handlePost(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const source = body.source === "voice" ? "voice" : "photo";
  const info = str(body.info, 4000);
  const name = str(body.name, 80);
  const price = str(body.price, 40);
  const offer = str(body.offer, 120);
  const brand = cleanBrand(body.brand);
  const contact = str(body.contact, 80) || brand?.whatsapp || "";
  const seen = str(body.seen, 1500);
  const dialect = DIALECTS[body.dialect] ? body.dialect : brand && DIALECTS[brand.dialect] ? brand.dialect : "egy";
  if (!info && !name && !seen) return fail("قولنا المنتج إيه الأول.", 400);
  if (tooMany(clientIp(req))) return fail("جرّبت كتير الساعة دي. استنى شوية.", 429);

  const facts = [
    name && `اسم المنتج: ${name}`,
    price && `السعر: ${price}`,
    offer && `العرض: ${offer}`,
    contact && `طريقة الطلب/التواصل: ${contact}`,
    seen && `اللي باين في صورة المنتج:\n${seen}`,
    info && (source === "voice" ? `كلام البياع في الفويس (متفرّغ تلقائياً وممكن فيه أخطاء سمع):\n«${info}»` : `معلومات تانية من البياع:\n${info}`),
  ].filter(Boolean).join("\n\n");

  const pack = await runAdPack({ facts, dialect, brand, signal: req.signal });
  if (!pack) return fail("الكاتب مشغول دلوقتي. جرّب تاني بعد دقيقة.", 503);
  return Response.json(pack);
}

export const POST = withSection("seller", handlePost);
