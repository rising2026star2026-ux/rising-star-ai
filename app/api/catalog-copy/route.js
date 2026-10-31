// «كتالوجك في دقيقة»: وصف قصير لكل منتج + جملة للغلاف، من أسماء المنتجات وأسعارها بس
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { askJson, str, list } from "@/lib/llmjson";

export const maxDuration = 45;
const tooMany = rateLimiter(15);

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const shop = str(body.shop, 60);
  const products = list(body.products, 30, (p) => (str(p?.name, 80) ? { name: str(p.name, 80), price: str(p?.price, 30), note: str(p?.note, 200) } : null));
  if (!products.length) return fail("اكتب أسماء المنتجات الأول.", 400);
  if (tooMany(clientIp(req))) return fail("جرّبت كتير الساعة دي. استنى شوية.", 429);

  const out = await askJson({
    messages: [
      {
        role: "system",
        content: [
          "انت كاتب كتالوجات مصري لمحلات صغيرة بتبيع أونلاين. اكتب بالعامية المصرية الخفيفة.",
          "لكل منتج: وصف قصير جداً (من 5 لـ 12 كلمة) بيبيّن فايدته، من غير إيموجي، ومن غير اختراع خامة أو مقاس أو ضمان أو شحن مش مذكور.",
          "tagline: جملة قصيرة للغلاف (من 3 لـ 8 كلمات) مناسبة لنوع المنتجات.",
          'رجّع JSON بس: {"tagline": "...", "descs": ["وصف المنتج 1", "وصف المنتج 2"]} بنفس ترتيب المنتجات وعددها.',
        ].join("\n"),
      },
      { role: "user", content: `اسم المحل: ${shop || "—"}\nالمنتجات:\n${products.map((p, i) => `${i + 1}. ${p.name}${p.price ? ` (${p.price})` : ""}${p.note ? ` — ${p.note}` : ""}`).join("\n")}` },
    ],
    normalize: (o) => {
      const descs = list(o.descs, products.length, (x) => str(x, 120) || " ");
      if (descs.length < Math.ceil(products.length * 0.7)) return null;
      return { tagline: str(o.tagline, 80), descs: products.map((_, i) => (descs[i] || "").trim()) };
    },
    mode: "fast",
    temperature: 0.7,
    maxTokens: 1800,
    signal: req.signal,
  });
  if (!out) return fail("الكاتب مشغول دلوقتي. جرّب تاني بعد دقيقة.", 503);
  return Response.json(out);
}
