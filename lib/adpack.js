// «باكدج الإعلان»: من معلومات المنتج بيكتب كل اللي التاجر محتاجه عشان ينشر:
// بوست فيسبوك، كابشن إنستجرام، رسالة واتساب، سكريبت تيك توك، وصف للمتجر، عناوين، هاشتاجات، وشعار ومميزات للفيديو.
// بيستخدمه مسار /api/ad-pack («صوّرها بموبايلك» و«اتكلم واحنا نكتب») ووكيل التاجر (/api/seller-agent).
import { askJson, str, list } from "@/lib/llmjson";
import { brandBlock } from "@/lib/brandprofile";

export const DIALECTS = { egy: "العامية المصرية", gulf: "اللهجة الخليجية", fusha: "الفصحى المبسطة" };

const SHAPE = `{
  "understood": "جملة أو اتنين: فهمنا إن المنتج إيه وبكام ومميزاته",
  "missing": ["معلومة مهمة ناقصة زي السعر أو المقاسات أو الشحن"],
  "facebook": "بوست فيسبوك كامل",
  "instagram": "كابشن إنستجرام",
  "whatsapp": "رسالة واتساب للعملاء أو الحالة",
  "tiktok": "سكريبت ريلز/تيك توك 30 ثانية",
  "description": "وصف المنتج للمتجر أو الكتالوج",
  "headlines": ["عنوان قصير 1", "عنوان 2", "عنوان 3"],
  "hashtags": ["#هاشتاج"],
  "tagline": "شعار من 3 لـ 7 كلمات",
  "features": ["ميزة قصيرة", "ميزة", "ميزة"]
}`;

function system(dialect) {
  return [
    `انت كاتب إعلانات مصري محترف للبياعين الصغيرين على السوشيال ميديا. اكتب كل حاجة بـ${DIALECTS[dialect]}، بكلام طبيعي زي ما الناس بتتكلم، من غير مبالغة رخيصة.`,
    "",
    "قواعد صارمة:",
    "- استخدم المعلومات اللي البياع قالها بس. ممنوع تخترع سعر أو خصم أو ضمان أو خامة أو مقاسات أو مدة توصيل أو مكان. لو معلومة مهمة ناقصة حط مكانها قوسين زي [اكتب السعر] وضيفها في missing.",
    "- لو البياع اتكلم في فويس، نضّف الكلام: شيل التكرار والـ«يعني» و«إممم»، وافهم المقصود.",
    "- facebook: أول سطر hook يجذب، بعدها المميزات في سطور قصيرة بإيموجي واحد في أول السطر، وبعدها السعر والعرض، وفي الآخر طريقة الطلب بوضوح (رقم أو «ابعتلنا رسالة»). من 60 لـ 120 كلمة.",
    "- instagram: أقصر (30-60 كلمة)، وما تحطش هاشتاجات جواه.",
    "- whatsapp: رسالة قصيرة للعملاء أو الحالة، بتنسيق واتساب (*كلام عريض* لاسم المنتج والسعر)، من 25 لـ 60 كلمة.",
    "- tiktok: سطر hook لأول 3 ثواني، وبعدها المشاهد بالترتيب: [مشهد] اللي يتصور + الكلام اللي يتقال، ومدة كل مشهد. المجموع 30 ثانية.",
    "- description: وصف واقعي للمنتج للمتجر أو الكتالوج من 40 لـ 80 كلمة، من غير إيموجي.",
    "- headlines: 3 عناوين إعلان قصيرة (أقل من 8 كلمات).",
    "- hashtags: 12 هاشتاج عربي وإنجليزي مرتبطين بالمنتج والسوق المصري، من غير مسافات جوه الهاشتاج.",
    "- tagline و features: للفيديو، قصيرين جداً (الميزة من 2 لـ 5 كلمات)، ومن غير إيموجي.",
    "- missing: أهم المعلومات الناقصة اللي هتفرق في البيع (أقصى 4)، ولو مفيش رجّع [].",
    "",
    "رجّع JSON بس بالشكل ده:",
    SHAPE,
  ].join("\n");
}

function normalize(o) {
  const facebook = str(o.facebook, 2500);
  const whatsapp = str(o.whatsapp, 1500);
  if (!facebook || !whatsapp) return null;
  const tag = (h) => {
    const t = str(h, 40).replace(/\s+/g, "_").replace(/^#*/, "#");
    return t.length > 2 ? t : null;
  };
  return {
    understood: str(o.understood, 400),
    missing: list(o.missing, 4, (x) => str(x, 80)),
    facebook,
    instagram: str(o.instagram, 1500),
    whatsapp,
    tiktok: str(o.tiktok, 2500),
    description: str(o.description, 1200),
    headlines: list(o.headlines, 3, (x) => str(x, 80)),
    hashtags: [...new Set(list(o.hashtags, 15, tag))].slice(0, 12),
    tagline: str(o.tagline, 60).replace(/[*_#"«»]/g, ""),
    features: list(o.features, 3, (x) => str(x, 50).replace(/[*_#"«»]/g, "")),
  };
}

/**
 * facts: نص المعلومات اللي التاجر قالها (مكتوب في سطور). brand: هوية النشاط بعد cleanBrand أو null.
 * بيرجّع الباكدج أو null لو الكاتب ما ردّش.
 */
export async function runAdPack({ facts, dialect = "egy", brand = null, signal }) {
  const d = DIALECTS[dialect] ? dialect : "egy";
  return askJson({
    messages: [{ role: "system", content: brand ? `${system(d)}\n\n${brandBlock(brand)}` : system(d) }, { role: "user", content: facts }],
    normalize,
    mode: "balanced",
    temperature: 0.7,
    maxTokens: 4000,
    signal,
  });
}
