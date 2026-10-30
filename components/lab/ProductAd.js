"use client";
// فيديو إعلان من صورة المنتج: صور + بيانات ← معاينة ← (تعليق صوتي اختياري) ← تصدير. كله على جهاز العميل.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Player } from "@remotion/player";
import { AdComp, FPS, FORMATS, planScenes, totalFrames } from "./AdComp";
import { THEMES } from "./ReelComp";
import { VOICES } from "@/lib/voices";
import { siteFont, ensureFont } from "@/components/studio/util";
import s from "./factory.module.css";
import a from "./ad.module.css";

const MAX_IMAGES = 4;

// تصغير الصورة (للسرعة) وتحويلها لرابط محلي
async function loadImage(file) {
  const bmp = await new Promise((resolve, reject) => {
    const u = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(u); resolve(im); };
    im.onerror = () => { URL.revokeObjectURL(u); reject(new Error("الصورة دي مش مدعومة. جرّب JPG أو PNG.")); };
    im.src = u;
  });
  const k = Math.min(1, 1400 / Math.max(bmp.naturalWidth, bmp.naturalHeight));
  const w = Math.max(1, Math.round(bmp.naturalWidth * k));
  const h = Math.max(1, Math.round(bmp.naturalHeight * k));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(bmp, 0, 0, w, h);
  const png = file.type === "image/png" || file.type === "image/webp";
  const blob = await new Promise((r) => c.toBlob(r, png ? "image/png" : "image/jpeg", 0.92));
  return { src: URL.createObjectURL(blob), w, h };
}

function audioDuration(url) {
  return new Promise((resolve) => {
    const au = new Audio();
    au.preload = "metadata";
    au.onloadedmetadata = () => resolve(Number.isFinite(au.duration) ? au.duration : null);
    au.onerror = () => resolve(null);
    au.src = url;
  });
}

async function pickContainer(f) {
  try {
    if (typeof VideoEncoder !== "undefined") {
      const r = await VideoEncoder.isConfigSupported({ codec: "avc1.640028", width: f.w, height: f.h, bitrate: 4_000_000, framerate: FPS });
      if (r.supported) return "mp4";
    }
  } catch {}
  return "webm";
}

export default function ProductAd() {
  const [images, setImages] = useState([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tagline, setTagline] = useState("");
  const [features, setFeatures] = useState(["", "", ""]);
  const [offer, setOffer] = useState("");
  const [cta, setCta] = useState("");
  const [handle, setHandle] = useState("");
  const [themeId, setThemeId] = useState("royal");
  const [fmt, setFmt] = useState("v");
  const [voiceOn, setVoiceOn] = useState(false);
  const [voice, setVoice] = useState("ar-EG-SalmaNeural");
  const [audios, setAudios] = useState({});
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");
  const [notes, setNotes] = useState([]);
  const [prog, setProg] = useState(null);
  const [out, setOut] = useState(null);
  const [font, setFont] = useState(null);
  const [busy, setBusy] = useState(false);
  const ctl = useRef(null);
  const urls = useRef([]);
  useEffect(() => { ensureFont(800).then(() => setFont(siteFont())); return () => urls.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const keep = (blob) => { const u = URL.createObjectURL(blob); urls.current.push(u); return u; };
  const addNote = (m) => setNotes((n) => (n.includes(m) ? n : [...n, m]));
  const supported = typeof window !== "undefined" && typeof VideoEncoder !== "undefined";
  const F = FORMATS[fmt];

  const plan = useMemo(() => planScenes({ name, tagline, features, offer, cta, handle }), [name, tagline, features, offer, cta, handle]);
  const scenes = useMemo(() => plan.map((p) => {
    const au = audios[p.id];
    const ok = voiceOn && au && au.text === p.say;
    return { id: p.id, min: p.min, d: ok && au.dur ? Math.max(p.min, au.dur + 0.5) : p.min, audio: ok ? au.url : null };
  }), [plan, audios, voiceOn]);
  const frames = totalFrames(scenes);
  const props = useMemo(() => ({ scenes, images, name: name.trim(), tagline, features, offer, cta, handle, themeId, font: font || "system-ui, sans-serif" }),
    [scenes, images, name, tagline, features, offer, cta, handle, themeId, font]);
  const voiceReady = voiceOn && plan.every((p) => audios[p.id]?.text === p.say);
  const ready = images.length > 0 && name.trim() && font;

  async function onFiles(e) {
    const files = [...(e.target.files || [])].slice(0, MAX_IMAGES - images.length);
    e.target.value = "";
    setErr("");
    for (const f of files) {
      try {
        const im = await loadImage(f);
        urls.current.push(im.src);
        setImages((all) => (all.length < MAX_IMAGES ? [...all, { id: `${Date.now()}${Math.random()}`, ...im }] : all));
      } catch (er) { setErr(er.message); }
    }
  }

  async function writeCopy() {
    if (!name.trim() || busy) return;
    setBusy(true); setErr(""); setStatus("بكتب الإعلان…");
    try {
      const r = await fetch("/api/adcopy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, desc, dialect: "egy" }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "حصلت مشكلة. جرّب تاني.");
      if (j.tagline) setTagline(j.tagline);
      if (j.features?.length) setFeatures([0, 1, 2].map((i) => j.features[i] || ""));
      addNote("الإعلان اتكتب بالذكاء الاصطناعي: راجعه وعدّل أي حاجة مش مظبوطة قبل ما تصدّر.");
    } catch (e) { setErr(e.message); }
    setStatus(""); setBusy(false);
  }

  async function makeVoices() {
    if (busy) return;
    setBusy(true); setErr(""); setStatus("بجهّز التعليق الصوتي…");
    ctl.current = new AbortController();
    let fail = 0;
    try {
      for (const p of plan) {
        if (audios[p.id]?.text === p.say) continue;
        let got = null;
        try {
          const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: p.say, voice }), signal: ctl.current.signal });
          if (r.ok) { const url = keep(await r.blob()); got = { text: p.say, url, dur: await audioDuration(url) }; }
        } catch (e) { if (e?.name === "AbortError") throw e; }
        if (got) setAudios((x) => ({ ...x, [p.id]: got })); else fail++;
      }
      if (fail) addNote(`الصوت ما اشتغلش في ${fail} مشهد. اضغط «جهّز التعليق الصوتي» تاني بعد شوية، أو صدّر من غير صوت.`);
    } catch {}
    setStatus(""); setBusy(false);
  }

  async function render() {
    setErr(""); setOut(null); setProg(0);
    ctl.current = new AbortController();
    try {
      const { renderMediaOnWeb } = await import("@remotion/web-renderer");
      const container = await pickContainer(F);
      const { getBlob } = await renderMediaOnWeb({
        composition: { id: "product-ad", component: AdComp, durationInFrames: frames, fps: FPS, width: F.w, height: F.h },
        inputProps: props,
        container,
        onProgress: (p) => setProg(p.progress ?? 0),
        signal: ctl.current.signal,
      });
      const blob = await getBlob();
      setOut({ url: keep(blob), ext: container, size: blob.size });
    } catch (e) {
      if (!ctl.current?.signal.aborted) setErr(String(e?.message || e));
    }
    setProg(null);
  }

  const setFeat = (i, v) => setFeatures((f) => f.map((x, k) => (k === i ? v : x)));
  const prevW = fmt === "h" ? 460 : fmt === "s" ? 340 : 280;

  return (
    <div className={s.root} id="pa-root">
      <span className={s.badge}><i />الفيديو بيتعمل ويتصدّر على جهازك، من غير علامة مائية</span>

      <div className={a.card}>
        <b className={a.h}>1) صور المنتج (حتى {MAX_IMAGES})</b>
        <div className={a.thumbs}>
          {images.map((im) => (
            <div key={im.id} className={a.thumb}>
              <img src={im.src} alt="" />
              <button type="button" aria-label="احذف الصورة" onClick={() => setImages((all) => all.filter((x) => x.id !== im.id))}>×</button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <label className={a.add}>
              <input type="file" accept="image/*" multiple onChange={onFiles} id="pa-file" />
              <span>＋ ارفع صورة</span>
            </label>
          )}
        </div>
        <small className={a.hint}>الأحسن صورة واضحة للمنتج على خلفية سادة. لو الخلفية مش حلوة، شيلها الأول من <Link href="/tool/remove-bg">أداة إزالة الخلفية</Link> وارفع الصورة هنا.</small>
      </div>

      <div className={a.card}>
        <b className={a.h}>2) بيانات الإعلان</b>
        <input className={s.input} dir="auto" placeholder="اسم المنتج *" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} id="pa-name" aria-label="اسم المنتج" />
        <div className={a.ai}>
          <input className={s.input} dir="auto" placeholder="وصف قصير للمنتج (اختياري، يساعد الكتابة بالذكاء الاصطناعي)" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} aria-label="وصف المنتج" />
          <button type="button" className="btn ghost" onClick={writeCopy} disabled={!name.trim() || busy} id="pa-ai">✨ اكتب الإعلان</button>
        </div>
        <input className={s.input} dir="auto" placeholder="شعار قصير (اختياري)" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={70} id="pa-tag" aria-label="الشعار" />
        {features.map((f, i) => (
          <input key={i} className={s.input} dir="auto" placeholder={`ميزة ${i + 1} (اختياري)`} value={f} onChange={(e) => setFeat(i, e.target.value)} maxLength={50} aria-label={`ميزة ${i + 1}`} />
        ))}
        <input className={s.input} dir="auto" placeholder="العرض أو السعر: مثلاً «299 جنيه» أو «خصم 30%»" value={offer} onChange={(e) => setOffer(e.target.value)} maxLength={40} id="pa-offer" aria-label="العرض" />
        <input className={s.input} dir="auto" placeholder="دعوة للشراء: مثلاً «اطلب دلوقتي على واتساب»" value={cta} onChange={(e) => setCta(e.target.value)} maxLength={60} id="pa-cta" aria-label="الدعوة للشراء" />
        <input className={s.input} dir="auto" placeholder="رقمك أو حسابك: «01012345678» أو «@متجرك»" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={40} id="pa-handle" aria-label="رقم أو حساب" />
      </div>

      <div className={a.card}>
        <b className={a.h}>3) الشكل</b>
        <div className={s.opts}>
          <select className={s.input} value={fmt} onChange={(e) => { setFmt(e.target.value); setOut(null); }} aria-label="المقاس" id="pa-fmt">
            {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
          <div className={s.themes}>
            {THEMES.map((t) => (
              <button key={t.id} type="button" className={`${s.dot} ${themeId === t.id ? s.dotOn : ""}`} onClick={() => setThemeId(t.id)} title={t.name} aria-label={t.name} style={{ background: `linear-gradient(135deg, ${t.c1}, ${t.c2})`, boxShadow: `inset -8px 0 0 ${t.accent}` }} />
            ))}
          </div>
        </div>
        <label className={a.check}>
          <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} id="pa-voice-on" />
          <span>أضف تعليق صوتي</span>
        </label>
        {voiceOn && (
          <div className={s.opts}>
            <select className={s.input} value={voice} onChange={(e) => { setVoice(e.target.value); setAudios({}); }} aria-label="الصوت">
              {Object.entries(VOICES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button type="button" className="btn ghost" onClick={makeVoices} disabled={busy || !ready} id="pa-voice">{voiceReady ? "✓ التعليق جاهز" : "🔊 جهّز التعليق الصوتي"}</button>
          </div>
        )}
      </div>

      {status && <p className={s.status} role="status">{status}</p>}
      {err && <p className={s.err} id="pa-err">{err}</p>}
      {notes.map((n) => <p key={n} className={s.note}>{n}</p>)}

      {ready ? (
        <>
          <div className={s.preview} data-pa="preview" style={{ width: `min(${prevW}px, 100%)` }}>
            <div dir="ltr">
              <Player component={AdComp} inputProps={props} durationInFrames={frames} fps={FPS} compositionWidth={F.w} compositionHeight={F.h} controls loop initialFrame={Math.min(40, Math.max(0, frames - 1))} style={{ width: "100%", borderRadius: 16 }} />
            </div>
          </div>
          {voiceOn && !voiceReady && <p className={s.note}>التعليق الصوتي لسه ما اتجهزش (أو الكلام اتغيّر). اضغط «جهّز التعليق الصوتي» وإلا هيتصدّر الفيديو من غير صوت.</p>}
          <div className={s.foot}>
            {!supported && <p className={s.note}>المتصفح ده مش بيدعم التصدير (محتاج Chrome حديث أو Safari 26).</p>}
            {prog !== null ? (
              <p className={s.status} role="status" id="pa-prog">بيتصدّر… {Math.round(prog * 100)}%</p>
            ) : (
              <button type="button" className="btn" id="pa-render" onClick={render} disabled={!supported || busy}>صدّر الفيديو ({Math.round(frames / FPS)} ث)</button>
            )}
            {out && (
              <>
                <video src={out.url} controls playsInline style={{ width: "100%", maxWidth: 320, borderRadius: 12 }} id="pa-video" />
                <a className="btn" href={out.url} download={`rising-star-ad.${out.ext}`} id="pa-dl">تحميل ({out.ext.toUpperCase()} · {(out.size / 1048576).toFixed(1)} MB)</a>
              </>
            )}
          </div>
        </>
      ) : (
        <p className={s.status}>ارفع صورة واكتب اسم المنتج وهتظهر المعاينة هنا.</p>
      )}
    </div>
  );
}
