"use client";
// رفع الملفات وقراءتها (للشات وللمشاريع): ملف ورا التاني، مع حالة لكل ملف ورسالة لو حصلت مشكلة
import { useRef, useState } from "react";
import { extractFile, kindOf, MAX_ALL, MAX_COUNT, OCR_PAGES } from "@/lib/docs";

export function useAttach({ docs, onAdd }) {
  const [pending, setPending] = useState([]);
  const [note, setNote] = useState("");
  const running = useRef(0);

  async function addFiles(list) {
    const files = [...(list || [])];
    if (!files.length) return;
    setNote("");
    let count = docs.length + running.current;
    let chars = docs.reduce((n, d) => n + d.chars, 0);
    for (const f of files) {
      if (count >= MAX_COUNT) { setNote(`أقصى عدد ${MAX_COUNT} ملف. شيل ملف عشان تضيف غيره.`); break; }
      const kind = kindOf(f);
      if (!kind) { setNote(`«${f.name}» صيغته مش مدعومة. ارفع PDF أو Word أو ملف نص أو صورة.`); continue; }
      count++;
      running.current++;
      const id = Math.random().toString(36).slice(2);
      setPending((p) => [...p, { id, name: f.name, kind, note: "بنجهّز الملف…" }]);
      try {
        const d = await extractFile(f, { onProgress: (t) => setPending((p) => p.map((x) => (x.id === id ? { ...x, note: t } : x))) });
        if (chars + d.chars > MAX_ALL) {
          setNote("الملفات مع بعض بقت أطول من المسموح (حوالي 400 صفحة). شيل ملف كبير وجرّب تاني.");
          count--;
        } else {
          chars += d.chars;
          onAdd(d);
          if (d.partial) setNote(`«${d.name}» ملف مصوّر، فقرينا أول ${OCR_PAGES} صفحات منه بس.`);
          else if (d.cut) setNote(`«${d.name}» طويل جداً، فأخدنا أول 250 صفحة تقريباً منه.`);
          else if (d.ocred) setNote(`«${d.name}» كان مصوّر، فقرينا الكلام من الصور. راجع الأرقام المهمة.`);
        }
      } catch (e) {
        count--;
        setNote(`«${f.name}»: ${e?.message || "ما قدرناش نقرا الملف ده."}`);
      } finally {
        running.current--;
        setPending((p) => p.filter((x) => x.id !== id));
      }
    }
  }

  return { pending, note, setNote, addFiles };
}
