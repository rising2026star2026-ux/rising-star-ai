// إعدادات «جرّب إعلانك على 100 زبون» المشتركة بين الصفحة والسيرفر
export const PLATFORMS = { facebook: "فيسبوك", instagram: "إنستجرام", tiktok: "تيك توك", whatsapp: "حالة واتساب" };
export const AUDIENCES = {
  all: "الجمهور العام في مصر",
  women: "ستات من 22 لـ 50 سنة",
  men: "رجالة من 22 لـ 55 سنة",
  youth: "شباب وطلاب من 17 لـ 26 سنة",
  moms: "أمهات عندهم أطفال",
  business: "أصحاب محلات وتجار",
};
export const AUDIENCE_LABELS = { all: "الكل", women: "ستات", men: "رجالة", youth: "شباب وطلاب", moms: "أمهات", business: "أصحاب محلات" };
export const SCORE_LABELS = {
  hook: ["أول سطر", "بيشد العين ولا بيتعدّى؟"],
  clarity: ["الوضوح", "واضح بتبيع إيه وبكام؟"],
  trust: ["الثقة", "يخلي الزبون يطمن؟"],
  offer: ["العرض", "مغري ومناسب للسعر؟"],
  cta: ["طريقة الطلب", "واضح يطلب إزاي؟"],
};
export const VERDICT_LABELS = { buy: "هيطلب", maybe: "بيفكر", skip: "عدّى" };
export const REACTION_EMOJI = { like: "👍", love: "❤️", haha: "😆", wow: "😮", sad: "😢", angry: "😡" };

// المفتاح اللي بيتنقل بيه إعلان من أداة تانية (صوّرها بموبايلك / اتكلم واحنا نكتب) لصفحة الاختبار
export const HANDOFF_KEY = "rs:test-ad";
