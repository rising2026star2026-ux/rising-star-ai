// «صوّرها بموبايلك»: بيتعرّف على المنتج من الصورة (اسم مقترح، النوع، الألوان، الكلام المكتوب عليه)،
// وبيقترح وصف إنجليزي لخلفية تصوير مناسبة ليه (للخلفية بالذكاء الاصطناعي). العميل بيأكد الاسم قبل الكتابة.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { askJson, describeImage, DATA_IMAGE, MAX_IMAGE, str, list } from "@/lib/llmjson";

export const maxDuration = 45;
const tooMany = rateLimiter(20);

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const image = typeof body.image === "string" ? body.image : "";
  if (!image || image.length > MAX_IMAGE || !DATA_IMAGE.test(image)) return fail("ارفع صورة JPG أو PNG.", 400);
  if (tooMany(clientIp(req))) return fail("جرّبت كتير الساعة دي. استنى شوية.", 429);

  const seen = await describeImage(
    image,
    "دي صورة منتج صوّرها بياع بموبايله عشان يبيعه أونلاين. قول في نقاط: 1) المنتج إيه بالظبط (النوع والشكل) 2) الألوان والخامة الظاهرة 3) أي كلام أو ماركة مكتوبة عليه بالنص الحرفي 4) أي ميزة باينة في الصورة نفسها. ما تخمّنش حاجة مش ظاهرة.",
    { signal: req.signal },
  );
  if (!seen) return fail("ما قدرناش نشوف الصورة دلوقتي. اكتب اسم المنتج بنفسك وكمّل.", 503);

  const out = await askJson({
    messages: [
      {
        role: "system",
        content: [
          "انت مساعد بياعين أونلاين في مصر. من وصف صورة المنتج، رجّع JSON بس بالشكل ده:",
          '{"name": "اسم بيعي قصير للمنتج بالعربي (2-5 كلمات)", "category": "النوع في كلمة أو اتنين", "colors": ["لون"], "visible": ["حاجة ظاهرة في الصورة ممكن تتقال في الإعلان"], "scene": "English prompt for an EMPTY product-photography background that suits this product, e.g. \'soft beige marble countertop, warm morning window light, blurred kitchen background\'. No product, no text, no people."}',
          "اعتمد على الوصف بس. لو الماركة مكتوبة على المنتج خليها في الاسم، ولو مش واضحة ما تخترعش ماركة.",
        ].join("\n"),
      },
      { role: "user", content: seen },
    ],
    normalize: (o) => {
      const name = str(o.name, 60);
      if (!name) return null;
      return {
        name,
        category: str(o.category, 40),
        colors: list(o.colors, 4, (x) => str(x, 20)),
        visible: list(o.visible, 4, (x) => str(x, 90)),
        scene: str(o.scene, 300).replace(/[^\x20-\x7E]/g, "") || "soft neutral studio backdrop, gentle gradient, soft shadows, professional product photography",
      };
    },
    mode: "fast",
    temperature: 0.3,
    maxTokens: 700,
    signal: req.signal,
  });
  if (!out) return fail("ما قدرناش نتعرف على المنتج. اكتب اسمه بنفسك وكمّل.", 503);
  return Response.json({ ...out, seen });
}
