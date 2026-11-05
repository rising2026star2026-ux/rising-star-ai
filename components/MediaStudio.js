"use client";
// استوديو موديلات OpenRouter: صور (توليد وتعديل بصور مرجعية) وصوت (تحويل نص لصوت أو موديل بيرد بصوت).
// النتايج بتفضل في الصفحة لحد ما تقفلها، فكل نتيجة ليها زرار تحميل.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { read } from "@/lib/store";
import s from "./mediastudio.module.css";

const ASPECTS = [
  ["auto", "تلقائي"], ["1:1", "مربع 1:1"], ["16:9", "عريض 16:9"], ["9:16", "طولي 9:16 (ستوري)"],
  ["4:3", "4:3"], ["3:4", "3:4"], ["3:2", "3:2"], ["2:3", "2:3"], ["4:5", "بوست 4:5"], ["5:4", "5:4"],
  ["21:9", "سينما 21:9"], ["9:21", "9:21"], ["2:1", "بانر 2:1"], ["1:2", "1:2"],
];
const RESOLUTIONS = [["1K", "1K (أسرع وأرخص)"], ["2K", "2K"], ["4K", "4K (أعلى جودة)"]];
const QUALITIES = [["auto", "تلقائي"], ["low", "منخفضة"], ["medium", "متوسطة"], ["high", "عالية"]];
const FORMATS = [["auto", "تلقائي"], ["png", "PNG"], ["jpeg", "JPEG"], ["webp", "WebP"], ["svg", "SVG (فيكتور)"]];
const BACKGROUNDS = [["auto", "تلقائي"], ["transparent", "شفافة"], ["opaque", "ملوّنة"]];

const VOICES = {
  openai: ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse"],
  google: ["Kore", "Puck", "Charon", "Fenrir", "Aoede", "Zephyr", "Leda", "Orus"],
};
const KIND_TITLE = { image: "توليد صور", speech: "تحويل نص لصوت", audio: "رد بالصوت" };

const ext = (type) => ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "audio/mpeg": "mp3", "audio/wav": "wav" }[type] || "bin");

function b64ToBlob(b64, type) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

// الصورة المرجعية: بنصغّرها لـ 1536 بكسل عشان الطلب ما يتخطاش حد الحجم
function shrink(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1536;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const png = file.type === "image/png" && file.size < 700_000;
      resolve(c.toDataURL(png ? "image/png" : "image/jpeg", 0.88));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}

const hasArabic = (t) => /[؀-ۿ]/.test(t);

export default function MediaStudio({ model }) {
  const isImage = model.kind === "image";
  const maker = String(model.id).split("/")[0];
  const voices = VOICES[maker] || [];

  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [quality, setQuality] = useState("auto");
  const [format, setFormat] = useState("auto");
  const [background, setBackground] = useState("auto");
  const [n, setN] = useState(1);
  const [seed, setSeed] = useState("");
  const [refs, setRefs] = useState([]);
  const [voice, setVoice] = useState(voices[0] || "");
  const [instructions, setInstructions] = useState("");
  const [speed, setSpeed] = useState(1);
  const [more, setMore] = useState(false);

  const [busy, setBusy] = useState(false);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [results, setResults] = useState([]);
  const ctrl = useRef(null);
  const fileRef = useRef(null);
  const urls = useRef([]);

  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); ctrl.current?.abort(); }, []);

  const keep = (blob) => {
    const u = URL.createObjectURL(blob);
    urls.current.push(u);
    return u;
  };

  async function addRefs(files) {
    setError("");
    const list = [...files].filter((f) => f.type.startsWith("image/")).slice(0, 4 - refs.length);
    try {
      const out = await Promise.all(list.map(shrink));
      setRefs((r) => [...r, ...out].slice(0, 4));
    } catch {
      setError("مقدرتش أقرا الصورة دي. جرّب صورة PNG أو JPG.");
    }
  }

  async function improve() {
    if (!prompt.trim() || improving) return;
    setImproving(true);
    setError("");
    try {
      const res = await fetch("/api/prompt-en", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: prompt, kind: "image" }) });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.prompt) setPrompt(j.prompt);
      else setError(j.error || "مقدرتش أحسّن الوصف دلوقتي.");
    } finally {
      setImproving(false);
    }
  }

  async function run() {
    if (busy) return;
    const text = prompt.trim();
    if (!text) { setError(isImage ? "اكتب وصف الصورة الأول." : "اكتب النص الأول."); return; }
    setBusy(true);
    setError("");
    setNote("");
    ctrl.current = new AbortController();
    const base = { model: model.id, pro: read("pro-code", "") || undefined };
    try {
      if (isImage) {
        const seedNum = seed.trim() === "" ? undefined : parseInt(seed, 10);
        const res = await fetch("/api/or-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...base, prompt: text, n, aspect, resolution, quality, format, background, seed: Number.isInteger(seedNum) ? seedNum : undefined, refs }),
          signal: ctrl.current.signal,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error || "حصلت مشكلة. جرّب تاني.");
          return;
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let got = 0;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, i);
            buf = buf.slice(i + 1);
            if (!line.trim()) continue;
            let m;
            try { m = JSON.parse(line); } catch { continue; }
            if (m.type === "image") {
              const blob = b64ToBlob(m.b64, m.media);
              got++;
              setResults((r) => [{ id: `${Date.now()}-${got}`, kind: "image", url: keep(blob), type: m.media, prompt: text }, ...r]);
            } else if (m.type === "error") {
              setError(m.error);
              if (m.text) setNote(m.text);
            } else if (m.type === "done") {
              const bits = [];
              if (typeof m.cost === "number") bits.push(`التكلفة: $${m.cost.toFixed(4)}`);
              if (m.text) bits.push(m.text);
              setNote(bits.join(" — "));
            }
          }
        }
      } else {
        const res = await fetch("/api/or-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...base, text, voice, instructions, speed }),
          signal: ctrl.current.signal,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error || "حصلت مشكلة. جرّب تاني.");
          if (j.transcript) setNote(j.transcript);
          return;
        }
        const blob = await res.blob();
        const type = (res.headers.get("content-type") || "audio/mpeg").split(";")[0];
        let transcript = "";
        try { transcript = decodeURIComponent(res.headers.get("x-transcript") || ""); } catch {}
        setResults((r) => [{ id: String(Date.now()), kind: "audio", url: keep(blob), type, prompt: text, transcript }, ...r]);
      }
    } catch (e) {
      if (e?.name !== "AbortError") setError("الاتصال اتقطع. جرّب تاني.");
    } finally {
      setBusy(false);
    }
  }

  const stop = () => ctrl.current?.abort();
  const editFrom = (r) => {
    fetch(r.url).then((x) => x.blob()).then((b) => addRefs([new File([b], `ref.${ext(r.type)}`, { type: r.type })]));
  };

  return (
    <main className={s.page}>
      <nav className={s.crumbs}><Link href="/models/all">كل الموديلات</Link></nav>
      <header className={s.head}>
        <h1 dir="auto">{model.name}</h1>
        <p><bdi>{model.maker}</bdi> • {KIND_TITLE[model.kind]}{model.free ? " • مجاني" : ""}</p>
      </header>

      <div className={s.layout}>
        <section className={s.panel} aria-label="الإعدادات">
          <label className={s.field}>
            <span>{isImage ? "وصف الصورة" : model.kind === "speech" ? "النص اللي هيتقري" : "اكتب للموديل وهيرد عليك بصوت"}</span>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={isImage ? 5 : 7} maxLength={4000} dir="auto"
              placeholder={isImage ? "مثلاً: زجاجة عطر على رخام أبيض، إضاءة ناعمة من الشباك، تصوير منتج احترافي" : "اكتب هنا..."} />
          </label>
          {isImage && hasArabic(prompt) && (
            <button type="button" className={s.ghost} onClick={improve} disabled={improving}>
              {improving ? "بحسّن الوصف..." : "حوّل الوصف لإنجليزي مفصّل (أغلب موديلات الصور بتفهمه أحسن)"}
            </button>
          )}

          {isImage ? (
            <>
              <div className={s.row}>
                <label className={s.field}><span>المقاس</span>
                  <select value={aspect} onChange={(e) => setAspect(e.target.value)}>{ASPECTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                </label>
                <label className={s.field}><span>الدقة</span>
                  <select value={resolution} onChange={(e) => setResolution(e.target.value)}>{RESOLUTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                </label>
                <label className={s.field}><span>العدد</span>
                  <select value={n} onChange={(e) => setN(Number(e.target.value))}>{[1, 2, 3, 4].map((v) => <option key={v} value={v}>{v}</option>)}</select>
                </label>
              </div>

              {model.vision && (
                <div className={s.field}>
                  <span>صور مرجعية (للتعديل أو نفس الستايل) — لحد 4</span>
                  <div className={s.refs}>
                    {refs.map((r, i) => (
                      <figure key={i} className={s.ref}>
                        <img src={r} alt={`صورة مرجعية ${i + 1}`} />
                        <button type="button" onClick={() => setRefs((x) => x.filter((_, k) => k !== i))} aria-label="شيل الصورة">×</button>
                      </figure>
                    ))}
                    {refs.length < 4 && (
                      <button type="button" className={s.addRef} onClick={() => fileRef.current?.click()}>+ أضف صورة</button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => { addRefs(e.target.files || []); e.target.value = ""; }} />
                </div>
              )}

              <button type="button" className={s.more} onClick={() => setMore((v) => !v)} aria-expanded={more}>
                {more ? "إخفاء الإعدادات المتقدمة" : "إعدادات متقدمة"}
              </button>
              {more && (
                <div className={s.row}>
                  <label className={s.field}><span>الجودة</span>
                    <select value={quality} onChange={(e) => setQuality(e.target.value)}>{QUALITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  </label>
                  <label className={s.field}><span>الصيغة</span>
                    <select value={format} onChange={(e) => setFormat(e.target.value)}>{FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  </label>
                  <label className={s.field}><span>الخلفية</span>
                    <select value={background} onChange={(e) => setBackground(e.target.value)}>{BACKGROUNDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  </label>
                  <label className={s.field}><span>Seed (لتكرار نفس النتيجة)</span>
                    <input inputMode="numeric" value={seed} onChange={(e) => setSeed(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="عشوائي" />
                  </label>
                </div>
              )}
              <p className={s.hint}>مش كل موديل بيدعم كل الإعدادات. اللي مش مدعوم بيتجاهله الموديل أو بيرفضه، ساعتها غيّر الإعداد وجرّب تاني.</p>
            </>
          ) : (
            <>
              <div className={s.row}>
                <label className={s.field}><span>الصوت (voice)</span>
                  <input list="voices" value={voice} onChange={(e) => setVoice(e.target.value)} placeholder="اسم الصوت" dir="ltr" />
                  <datalist id="voices">{voices.map((v) => <option key={v} value={v} />)}</datalist>
                </label>
                {model.kind === "speech" && (
                  <label className={s.field}><span>السرعة: {speed.toFixed(1)}×</span>
                    <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
                  </label>
                )}
              </div>
              {model.kind === "speech" && (
                <label className={s.field}><span>طريقة الإلقاء (اختياري)</span>
                  <input value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={500} dir="auto" placeholder="مثلاً: صوت هادي ودافي، بلهجة مصرية، كأنه إعلان" />
                </label>
              )}
              <p className={s.hint}>الأصوات بتختلف من موديل للتاني. لو الموديل رفض الصوت، جرّب اسم تاني من القايمة أو سيبه فاضي.</p>
            </>
          )}

          <div className={s.actions}>
            <button type="button" className={s.primary} onClick={run} disabled={busy}>
              {busy ? (isImage ? "بيولّد..." : "بيجهّز الصوت...") : isImage ? (n > 1 ? `ولّد ${n} صور` : "ولّد الصورة") : "ولّد الصوت"}
            </button>
            {busy && <button type="button" className={s.ghost} onClick={stop}>إلغاء</button>}
          </div>
          {busy && isImage && <p className={s.hint} role="status">الصور الكبيرة ممكن تاخد لحد دقيقتين.</p>}
          {error && <p className={s.error} role="alert">{error}</p>}
          {note && <p className={s.note} dir="auto">{note}</p>}
        </section>

        <section className={s.results} aria-label="النتايج" aria-live="polite">
          {!results.length && (
            <div className={s.empty}>
              <p>{isImage ? "الصور اللي هتولّدها هتظهر هنا." : "الصوت اللي هتولّده هيظهر هنا."}</p>
              <p className={s.hint}>النتايج بتفضل لحد ما تقفل الصفحة، فحمّل اللي عايزه.</p>
            </div>
          )}
          <ul className={isImage ? s.gallery : s.tracks}>
            {results.map((r) => (
              <li key={r.id} className={s.item}>
                {r.kind === "image" ? (
                  <a href={r.url} target="_blank" rel="noreferrer"><img src={r.url} alt={r.prompt.slice(0, 120)} /></a>
                ) : (
                  <>
                    <audio controls src={r.url} preload="metadata" />
                    <p className={s.cap} dir="auto">{r.transcript || r.prompt.slice(0, 200)}</p>
                  </>
                )}
                <div className={s.itemActions}>
                  <a href={r.url} download={`rising-star-${r.id}.${ext(r.type)}`}>تحميل</a>
                  {r.kind === "image" && model.vision && <button type="button" onClick={() => editFrom(r)}>عدّل عليها</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
