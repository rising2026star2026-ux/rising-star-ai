// خيارات لوحة التحكم — نفس الملف بيستخدمه المتصفح والسيرفر عشان نتأكد إن القيم سليمة
export const SETTINGS = {
  voice: {
    label: "لغة الرد",
    choices: { auto: "تلقائي", fusha: "فصحى", masri: "مصري", khaleeji: "خليجي" },
    rule: {
      fusha: "اكتب بالعربية الفصحى المبسطة.",
      masri: "اكتب باللهجة المصرية الطبيعية ما لم تتطلب المهمة لغة رسمية أو لغة أخرى.",
      khaleeji: "اكتب باللهجة الخليجية الطبيعية ما لم تتطلب المهمة لغة رسمية أو لغة أخرى.",
    },
  },
  depth: {
    label: "تفصيل الرد",
    choices: { auto: "تلقائي", brief: "مختصر", detailed: "مفصّل" },
    rule: { brief: "اجعل الرد مختصراً ومركزاً.", detailed: "اجعل الرد مفصلاً وشاملاً بأمثلة." },
  },
  style: {
    label: "طريقة التفكير",
    choices: { precise: "دقيق", balanced: "متوازن", creative: "مبدع" },
    temp: { precise: 0.3, balanced: 0.7, creative: 1.0 },
  },
};

export const DEFAULT_SETTINGS = { voice: "auto", depth: "auto", style: "balanced" };

// أزرار تعديل النتيجة بعد ما تطلع
export const REFINES = {
  shorter: { label: "أقصر", rule: "اختصر الرد السابق للنصف تقريباً مع الحفاظ على الأهم." },
  longer: { label: "أطول", rule: "وسّع الرد السابق بتفاصيل وأمثلة أكثر." },
  simpler: { label: "أبسط", rule: "أعد كتابة الرد السابق بلغة أبسط." },
  pro: { label: "أكثر احترافية", rule: "أعد كتابة الرد السابق بأسلوب أكثر احترافية ورسمية." },
  bullets: { label: "في نقاط", rule: "حوّل الرد السابق إلى نقاط منظمة." },
  english: { label: "بالإنجليزي", rule: "ترجم الرد السابق إلى الإنجليزية ترجمة طبيعية." },
};

export function cleanSettings(s = {}) {
  const out = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(SETTINGS)) {
    if (s[k] && SETTINGS[k].choices[s[k]]) out[k] = s[k];
  }
  return out;
}
