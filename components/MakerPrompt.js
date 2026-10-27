"use client";
// اكتب فكرتك بالعربي → نترجمها ونحسّنها لوصف إنجليزي (أغلب المولّدات بتفهمه أحسن) → انسخه والصقه في الأداة
import { useState } from "react";
import { toast } from "@/lib/store";
import s from "./maker.module.css";

export default function MakerPrompt({ kind = "image", url, name, onPrompt }) {
  const [idea, setIdea] = useState("");
  const [en, setEn] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function translate() {
    if (!idea.trim()) { setErr("اكتب فكرتك الأول."); return null; }
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/prompt-en", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: idea, kind }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "حصل خطأ، جرّب تاني.");
      setEn(data.prompt);
      onPrompt?.(data.prompt);
      return data.prompt;
    } catch (e) { setErr(e.message); return null; } finally { setBusy(false); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(en); toast("اتنسخ ✓ الصقه في الأداة"); } catch { toast("انسخه بإيدك من الصندوق"); }
  }

  return (
    <section className={s.studio}>
      <h2>اكتب فكرتك بالعربي</h2>
      <p>هنترجمها ونحسّنها لوصف إنجليزي مفصّل، وبعدين تنسخه وتلصقه في {name}.</p>
      <textarea
        value={idea} maxLength={600} onChange={(e) => setIdea(e.target.value)}
        placeholder={kind === "video" ? "مثلاً: قطة بتجري في شارع قديم في القاهرة وقت الغروب" : "مثلاً: فنجان قهوة عربي على ترابيزة خشب جنب شباك الصبح"}
        aria-label="فكرتك بالعربي"
      />
      <div className={s.row}>
        <button type="button" className={`${s.btn} ${s.main}`} onClick={translate} disabled={busy}>{busy ? "بنكتب الوصف..." : "ترجم وحسّن الوصف"}</button>
        {en && <button type="button" className={`${s.btn} ${s.yellow}`} onClick={copy}>نسخ الوصف</button>}
        {en && url && <a className={s.btn} href={url} target="_blank" rel="noopener noreferrer">افتح {name} ↗</a>}
      </div>
      {err && <p className={s.err}>{err}</p>}
      {en && <div className={s.en} dir="ltr">{en}</div>}
    </section>
  );
}
