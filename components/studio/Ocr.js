"use client";
// استخراج نص من صورة (OCR): الصورة بتتصغّر على جهازك وبتتبعت لقارئ الصور عشان يرجّع النص، ومبتتحفظش.
import { useState } from "react";
import { Drop, Note, Busy, styles as s } from "./ui";
import { loadImage, makeCanvas, IMAGE_TYPES } from "./util";
import { copyText } from "@/lib/imagefile";
import { toast } from "@/lib/store";

const MAX_SIDE = 1800;

async function toDataUrl(file) {
  const img = await loadImage(file);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const k = Math.min(1, MAX_SIDE / Math.max(w, h));
  const c = makeCanvas(Math.round(w * k), Math.round(h * k));
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; // الصور الشفافة تبقى على خلفية بيضا عشان القراءة
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.88);
}

export default function Ocr() {
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(files) {
    setError(""); setText(""); setBusy(true);
    try {
      const url = await toDataUrl(files[0]);
      setPreview(url);
      const r = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url, mode: "ocr" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "ما قدرناش نقرا الصورة دلوقتي.");
      if (!j.text?.trim()) throw new Error("مش لاقيين كلام واضح في الصورة دي. جرّب صورة أوضح أو أقرب.");
      setText(j.text.trim());
    } catch (e) {
      setError(e.message || "حصلت مشكلة. جرّب تاني.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.root}>
      <Drop accept={IMAGE_TYPES} onFiles={onFiles} compact={!!preview} title={preview ? "صورة تانية" : "اسحب صورة فيها كلام هنا أو اضغط تختار"} hint="سكرين شوت، صورة مستند، فاتورة، أو كتاب. تقدر كمان تلزق صورة بـ Ctrl+V." />
      {preview && (
        <div className={s.calcBox}>
          <div className={s.calcAside} style={{ position: "static" }}>
            <img src={preview} alt="الصورة اللي اتقرت" style={{ width: "100%", maxHeight: 360, objectFit: "contain", borderRadius: 12 }} />
          </div>
          <div className={s.calcForm}>
            {busy ? <Busy text="بنقرا الكلام اللي في الصورة…" /> : text ? (
              <>
                <textarea className={`${s.input} ${s.bigText}`} dir="auto" value={text} onChange={(e) => setText(e.target.value)} rows={12} aria-label="النص المستخرج" />
                <div className={s.rowBtns}>
                  <button type="button" className="btn" onClick={async () => { if (await copyText(text)) toast("اتنسخ النص"); }}>نسخ النص</button>
                </div>
                <Note>القراءة بالذكاء الاصطناعي ممكن تغلط في الأرقام والأسماء، فراجعها قبل ما تعتمد عليها. وتقدر تعدّل النص هنا قبل النسخ.</Note>
              </>
            ) : null}
          </div>
        </div>
      )}
      {error && <Note tone="warn">{error}</Note>}
    </div>
  );
}
