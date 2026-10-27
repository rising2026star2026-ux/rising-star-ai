"use client";
// مولّد صور جوه الموقع (Pollinations): اكتب بالعربي، بنترجم الوصف وبنطلعلك الصورة هنا
import { useState } from "react";
import { toast } from "@/lib/store";
import s from "./maker.module.css";

const SIZES = [["1024x1024", "مربع"], ["768x1024", "طولي"], ["1024x768", "عرضي"]];

export default function MakerImageGen({ base }) {
  const [idea, setIdea] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [en, setEn] = useState("");
  const [src, setSrc] = useState("");
  const [state, setState] = useState("idle"); // idle | prompt | image | done | error
  const [err, setErr] = useState("");

  async function run() {
    if (!idea.trim()) { setErr("اكتب فكرتك الأول."); return; }
    setErr(""); setSrc(""); setState("prompt");
    try {
      const res = await fetch("/api/prompt-en", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: idea, kind: "image" }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "حصل خطأ، جرّب تاني.");
      setEn(data.prompt);
      const [w, h] = size.split("x");
      setState("image");
      setSrc(`${base}${encodeURIComponent(data.prompt)}?width=${w}&height=${h}&seed=${Math.floor(Math.random() * 1e6)}&nologo=true`);
    } catch (e) { setErr(e.message); setState("error"); }
  }

  async function download() {
    try {
      const blob = await (await fetch(src)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "rising-star-image.jpg"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch { window.open(src, "_blank", "noopener"); }
  }

  const busy = state === "prompt" || state === "image";
  return (
    <section className={s.studio}>
      <h2>ولّد صورتك هنا</h2>
      <p>اكتب بالعربي، وإحنا بنكتب الوصف الإنجليزي ونطلّع الصورة جوه الموقع.</p>
      <textarea value={idea} maxLength={600} onChange={(e) => setIdea(e.target.value)} placeholder="مثلاً: بيت قديم في الإسكندرية على البحر وقت الغروب" aria-label="فكرة الصورة" />
      <div className={s.row}>
        {SIZES.map(([v, l]) => (
          <button key={v} type="button" className={s.pill} aria-pressed={size === v} onClick={() => setSize(v)} style={size === v ? { background: "var(--ink)", color: "var(--yellow)" } : undefined}>{l}</button>
        ))}
      </div>
      <div className={s.row}>
        <button type="button" className={`${s.btn} ${s.main}`} onClick={run} disabled={busy}>{busy ? "بنجهّز الصورة..." : "ولّد الصورة"}</button>
        {state === "done" && <button type="button" className={`${s.btn} ${s.yellow}`} onClick={download}>تنزيل الصورة</button>}
        {en && <button type="button" className={s.btn} onClick={async () => { try { await navigator.clipboard.writeText(en); toast("اتنسخ الوصف ✓"); } catch {} }}>نسخ الوصف</button>}
      </div>
      {err && <p className={s.err}>{err}</p>}
      {(src || busy) && (
        <div className={s.result}>
          {state !== "done" && state !== "error" && <span className={s.wait}>{state === "prompt" ? "بنكتب الوصف..." : "الصورة بتتولّد، ثواني..."}</span>}
          {src && (
            <img
              src={src} alt={idea} hidden={state !== "done"}
              onLoad={() => setState("done")}
              onError={() => { setState("error"); setErr("الخدمة مشغولة دلوقتي. جرّب تاني بعد شوية."); }}
            />
          )}
        </div>
      )}
      {en && <div className={s.en} dir="ltr">{en}</div>}
    </section>
  );
}
