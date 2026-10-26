import { tools } from "./tools";

// توحيد الحروف العربية عشان البحث يلاقي "اعلان" و"إعلان" مثلاً
export function norm(s = "") {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

// كلمات الناس العادية → الكلمة اللي في اسم الأداة
const ALIASES = {
  لخص: "تلخيص", لخصلي: "تلخيص", ترجم: "مترجم", ترجملي: "مترجم", صحح: "تصحيح", اشرح: "شرح", اشرحلي: "شرح",
  مساله: "مسائل", رياضيات: "مسائل", بوست: "منشور", cv: "سيره", سيفي: "سيره", برزنتيشن: "عرض", باوربوينت: "عرض",
  ايميل: "ايميل", بريد: "ايميل", adspy: "اعلانات", جاسوس: "اعلانات", فوتوشوب: "محرر", photoshop: "محرر", فلتر: "محرر",
  كانفا: "بوستات", canva: "بوستات", بوستر: "بوستات", تصميم: "مصمم", خلفيه: "الخلفيه",
  مقاس: "مقاس", حجم: "ضغط", صغر: "ضغط", ادوبي: "تصميم", اكروبات: "pdf", بريمير: "الفيديو", فيديو: "فيديو", ريلز: "الريلز", ريل: "الريلز", مونتاج: "فيديو", اغنيه: "اغنيه", لوجو: "لوجو", شعار: "لوجو", كود: "كود", برنامج: "كود",
};

const index = tools.map((t) => ({ t, name: norm(t.name), desc: norm(t.desc), task: norm(t.task) }));

export function findTools(query, limit = 6) {
  const raw = norm(query).split(/\s+/).filter((w) => w.length > 1);
  const words = raw.flatMap((w) => (ALIASES[w] ? [{ w, k: 1 }, { w: norm(ALIASES[w]), k: 2 }] : [{ w, k: 1 }]));
  if (!words.length) return [];
  return index
    .map(({ t, name, desc, task }) => {
      let score = 0;
      for (const { w, k } of words) {
        const stem = w.replace(/^(ال|و|ب|ل)/, "");
        if (name.includes(w) || (stem.length > 2 && name.includes(stem))) score += 4 * k;
        if (desc.includes(w) || (stem.length > 2 && desc.includes(stem))) score += 2 * k;
        if (task.includes(w) || (stem.length > 2 && task.includes(stem))) score += 1 * k;
      }
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.t);
}
