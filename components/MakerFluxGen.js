"use client";
// «صورة من وصف عربي»: اكتب بالعربي ← بنكتب وصف إنجليزي ← Flux بيرسم الصورة.
// الرسم بيتم من متصفح الزائر على Hugging Face (حصته المجانية هو)، ولو خلصت بنحوّل لمولّد السيرفر الاحتياطي.
import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/store";
import { callSpace, fileUrl, withTimeout } from "@/lib/hfspace";
import s from "./maker.module.css";

const FLUX = "https://black-forest-labs-flux-1-schnell.hf.space";
const SIZES = [["1024x1024", "مربع"], ["768x1024", "طولي (ستوري)"], ["1024x768", "عرضي"]];
const IDEAS = [
  "فنجان قهوة عربي على ترابيزة خشب جنب شباك الصبح",
  "شارع المعز في القاهرة بالليل بالفوانيس، صورة سينمائية",
  "لوجو بسيط لمحل حلويات اسمه نجمة، ألوان دهبي وأزرق",
  "قطة لابسة نضارة شمس على شط إسكندرية",
];

export default function MakerFluxGen() {
  const [idea, setIdea] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [en, setEn] = useState("");
  const [stage, setStage] = useState("idle"); // idle | prompt | draw | backup | done
  const [err, setErr] = useState("");
  const [img, setImg] = useState(null); // { src, blob? }
  const [history, setHistory] = useState([]);
  const stop = useRef(null);

  useEffect(() => () => stop.current?.abort(), []);

  async function drawOnSpace(prompt, signal) {
    const [w, h] = size.split("x").map(Number);
    const { out, base } = await callSpace(FLUX, "infer", [prompt, 0, true, w, h, 4], { signal });
    const url = fileUrl(out?.[0], base);
    if (!url) throw new Error("no image");
    const r = await fetch(url, { signal });
    if (!r.ok) throw new Error("image fetch failed");
    return await r.blob();
  }

  async function drawOnServer(prompt, signal) {
    const r = await fetch("/api/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, size }), signal });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || "المولّد مشغول دلوقتي. جرّب بعد دقيقة.");
    }
    return await r.blob();
  }

  async function run() {
    if (!idea.trim()) { setErr("اكتب فكرتك الأول."); return; }
    stop.current?.abort();
    const ctrl = new AbortController();
    stop.current = ctrl;
    setErr(""); setImg(null); setStage("prompt");
    try {
      const res = await fetch("/api/prompt-en", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: idea, kind: "image" }), signal: ctrl.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "حصل خطأ، جرّب تاني.");
      const prompt = data.prompt;
      setEn(prompt);

      let blob = null;
      setStage("draw");
      const t = withTimeout(120_000, ctrl.signal);
      try { blob = await drawOnSpace(prompt, t.signal); }
      catch (e) { if (ctrl.signal.aborted) throw e; }
      finally { t.done(); }

      if (!blob) {
        setStage("backup");
        blob = await drawOnServer(prompt, ctrl.signal);
      }
      const src = URL.createObjectURL(blob);
      const item = { src, blob, idea };
      setImg(item);
      setHistory((h) => [item, ...h].slice(0, 8));
      setStage("done");
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setErr(e.message || "حصل خطأ، جرّب تاني.");
      setStage("idle");
    }
  }

  function download(item = img) {
    if (!item) return;
    const a = document.createElement("a");
    a.href = item.src;
    a.download = `rising-star-${Date.now()}.${(item.blob?.type || "image/jpeg").includes("png") ? "png" : item.blob?.type?.includes("webp") ? "webp" : "jpg"}`;
    a.click();
  }

  async function share() {
    try {
      const file = new File([img.blob], "rising-star.jpg", { type: img.blob.type || "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: idea }); return; }
    } catch { return; }
    download();
  }

  const busy = stage === "prompt" || stage === "draw" || stage === "backup";
  const wait = { prompt: "بنكتب الوصف بالإنجليزي...", draw: "Flux بيرسم الصورة، من 5 لـ30 ثانية...", backup: "المولّد الأساسي مشغول، بنجرب مولّد تاني..." }[stage];

  return (
    <section className={s.studio}>
      <h2>صورة من وصف عربي</h2>
      <p>اكتب اللي في دماغك بالعربي أو بالعامية. إحنا بنحوّله لوصف احترافي، وموديل Flux بيرسمه هنا.</p>
      <textarea value={idea} maxLength={600} onChange={(e) => setIdea(e.target.value)} placeholder="مثلاً: بيت قديم في الإسكندرية على البحر وقت الغروب" aria-label="فكرة الصورة"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }} />
      {!idea && (
        <div className={s.row}>
          {IDEAS.map((t) => <button key={t} type="button" className={s.pill} onClick={() => setIdea(t)} style={{ cursor: "pointer" }}>{t}</button>)}
        </div>
      )}
      <div className={s.row} role="group" aria-label="مقاس الصورة">
        {SIZES.map(([v, l]) => (
          <button key={v} type="button" className={s.pill} aria-pressed={size === v} onClick={() => setSize(v)}
            style={{ cursor: "pointer", ...(size === v ? { background: "var(--ink)", color: "var(--yellow)" } : null) }}>{l}</button>
        ))}
      </div>
      <div className={s.row}>
        <button type="button" className={`${s.btn} ${s.main}`} onClick={run} disabled={busy}>{busy ? "بنجهّز الصورة..." : img ? "ولّد صورة تانية" : "ولّد الصورة"}</button>
        {busy && <button type="button" className={s.btn} onClick={() => { stop.current?.abort(); setStage("idle"); }}>إلغاء</button>}
        {img && !busy && <button type="button" className={`${s.btn} ${s.yellow}`} onClick={() => download()}>تنزيل</button>}
        {img && !busy && <button type="button" className={s.btn} onClick={share}>مشاركة</button>}
        {en && !busy && <button type="button" className={s.btn} onClick={async () => { try { await navigator.clipboard.writeText(en); toast("اتنسخ الوصف ✓"); } catch {} }}>نسخ الوصف</button>}
      </div>
      {err && <p className={s.err}>{err}</p>}
      {(busy || img) && (
        <div className={s.result} aria-live="polite">
          {busy && <span className={s.wait}>{wait}</span>}
          {img && !busy && <img src={img.src} alt={img.idea} />}
        </div>
      )}
      {en && <div className={s.en} dir="ltr">{en}</div>}
      {history.length > 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 8, marginTop: 12 }}>
          {history.map((h) => (
            <button key={h.src} type="button" onClick={() => setImg(h)} title={h.idea}
              style={{ padding: 0, border: h === img ? "2px solid var(--blue)" : "1.5px solid rgba(11,11,20,.1)", borderRadius: 12, overflow: "hidden", cursor: "pointer", background: "none", aspectRatio: "1" }}>
              <img src={h.src} alt={h.idea} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>
      )}
      <p style={{ margin: "12px 0 0", fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.7 }}>
        كل زائر ليه عدد صور يومي ببلاش على المولّد الأساسي. لو خلص، بنكمّل على مولّد احتياطي بحد في الساعة. الصور بتتمسح لما تقفل الصفحة، فنزّل اللي يعجبك.
      </p>
    </section>
  );
}
