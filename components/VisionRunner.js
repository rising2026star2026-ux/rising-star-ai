"use client";
// قارئ الصور: ارفع صورة، اسأل عنها (اختياري)، واستلم الوصف أو النص المقروء
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ShareBar from "@/components/ShareBar";

async function shrink(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

export default function VisionRunner({ toolName }) {
  const [image, setImage] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const fileRef = useRef(null);
  const outRef = useRef(null);
  const mdRef = useRef(null);

  // زرار «جرّب المثال» في شرح الأداة
  useEffect(() => {
    const onFill = (e) => { if (typeof e.detail === "string") setQuestion(e.detail.slice(0, 1500)); };
    window.addEventListener("rs-fill", onFill);
    return () => window.removeEventListener("rs-fill", onFill);
  }, []);

  async function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    try { setImage(await shrink(f)); } catch { setError("مقدرناش نفتح الصورة. جرّب PNG أو JPG."); }
  }

  async function run() {
    if (!image || loading) return;
    setLoading(true); setError(""); setResult("");
    try {
      const res = await fetch("/api/vision", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, question }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "حصلت مشكلة. جرّب تاني.");
      setResult(data.text);
      setTimeout(() => outRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="composer">
        <div className="composer-top"><span>١. ارفع الصورة</span></div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", margin: "6px 0 14px" }}>
          {image ? (
            <>
              <img src={image} alt="الصورة المرفوعة" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 14, border: "1px solid rgba(128,128,150,0.3)" }} />
              <button type="button" className="btn ghost" onClick={() => { setImage(""); setResult(""); if (fileRef.current) fileRef.current.value = ""; }}>شيل الصورة</button>
            </>
          ) : (
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>اختار صورة</button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} hidden />
        </div>

        <div className="composer-top"><label htmlFor="vq">٢. اسأل عنها (اختياري)</label></div>
        <textarea
          id="vq" value={question} maxLength={1500} onChange={(e) => setQuestion(e.target.value)}
          placeholder="مثلاً: اقرا النص اللي في الصورة وترجمه للعربي. ولو سبتها فاضية هوصفها لك."
        />
        <div className="composer-bar">
          <div className="composer-actions">
            <span className="meta">الصورة بتتصغّر على جهازك وما بتتخزنش</span>
            <button className="btn" onClick={run} disabled={!image || loading}>{loading ? "بنقرا الصورة…" : "نفّذ"}</button>
          </div>
        </div>
        {error && <div className="error" role="alert">{error}</div>}
      </div>

      {(loading || result) && (
        <div className="result" ref={outRef} aria-live="polite">
          {!result ? (
            <div className="shimmer" aria-label="جاري القراءة"><span /><span /><span /></div>
          ) : (
            <>
              <div ref={mdRef} className="md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown></div>
              <div className="result-actions">
                <button className="btn ghost" onClick={() => navigator.clipboard?.writeText(result)}>نسخ</button>
                <button className="btn ghost" onClick={run}>إعادة</button>
              </div>
              <ShareBar text={result} title={toolName} getHtml={() => mdRef.current?.innerHTML || ""} />
            </>
          )}
        </div>
      )}
    </>
  );
}
