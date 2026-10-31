// «من ساعتين» و«3 ملفات» بالمصري
export function ago(ts) {
  if (!ts) return "";
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "دلوقتي";
  if (m < 60) return m === 1 ? "من دقيقة" : m === 2 ? "من دقيقتين" : `من ${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "من ساعة" : h === 2 ? "من ساعتين" : `من ${h} ساعات`;
  const d = Math.round(h / 24);
  if (d === 1) return "امبارح";
  if (d < 7) return d === 2 ? "من يومين" : `من ${d} أيام`;
  return new Date(ts).toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
}

const DUAL = { ملف: "ملفين", محادثة: "محادثتين" };
const PLURAL = { ملف: "ملفات", محادثة: "محادثات" };

export function countLabel(n, word) {
  if (!n) return `مفيش ${PLURAL[word] || word}`;
  if (n === 1) return `${word} واحد${word.endsWith("ة") ? "ة" : ""}`;
  if (n === 2) return DUAL[word] || `2 ${word}`;
  if (n <= 10) return `${n} ${PLURAL[word] || word}`;
  return `${n} ${word}`;
}
