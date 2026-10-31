"use client";
// «اتكلم بس.. واحنا نكتب»: البياع بيسجّل فويس بالمصري عن منتجه (أو يرفع فويس من واتساب)،
// الكلام بيظهر وهو بيتكلم (لو المتصفح بيدعم)، وبعدين بيتفرّغ بدقة، ويتحوّل لبوستات لكل منصة.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdPack from "./AdPack";
import s from "./seller.module.css";
import v from "./voice.module.css";

const MAX_SEC = 120;
const BARS = 28;
const PROMPTS = ["اسم المنتج", "بكام", "مميزاته", "الألوان والمقاسات", "الشحن والدفع", "إزاي يطلب"];

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    try { if (MediaRecorder.isTypeSupported(m)) return m; } catch {}
  }
  return "";
}
const extFor = (mime) => (mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm");
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

export default function VoicePost() {
  const [stage, setStage] = useState("idle"); // idle | rec | stt | text | pack
  const [sec, setSec] = useState(0);
  const [live, setLive] = useState("");
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");
  const [levels, setLevels] = useState(() => Array(BARS).fill(0.08));
  const [error, setError] = useState("");
  const [pack, setPack] = useState(null);
  const [busy, setBusy] = useState(false);
  const rec = useRef(null);
  const chunks = useRef([]);
  const stream = useRef(null);
  const speech = useRef(null);
  const audioCtx = useRef(null);
  const raf = useRef(0);
  const timer = useRef(0);
  const finalText = useRef("");
  const packRef = useRef(null);

  useEffect(() => () => cleanup(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function cleanup() {
    cancelAnimationFrame(raf.current);
    clearInterval(timer.current);
    try { speech.current?.abort(); } catch {}
    speech.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    try { audioCtx.current?.close(); } catch {}
    audioCtx.current = null;
  }

  async function start() {
    setError(""); setLive(""); setPack(null); finalText.current = "";
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("المتصفح ده مش بيسجّل صوت. ارفع فويس من واتساب أو اكتب الكلام بإيدك.");
      return;
    }
    let st;
    try {
      st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setError("محتاجين إذن المايك. اسمح للموقع يستخدم المايك من إعدادات المتصفح، وجرّب تاني.");
      return;
    }
    stream.current = st;
    const mime = pickMime();
    const r = new MediaRecorder(st, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
    chunks.current = [];
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => finish(r.mimeType || mime || "audio/webm");
    r.start(500);
    rec.current = r;

    // مستوى الصوت (الأعمدة اللي بتتحرك)
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ac = new AC();
      ac.resume?.().catch(() => {});
      const src = ac.createMediaStreamSource(st);
      const an = ac.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      audioCtx.current = ac;
      const buf = new Uint8Array(an.frequencyBinCount);
      let last = 0;
      const tick = (ts) => {
        raf.current = requestAnimationFrame(tick);
        if (ts - last < 70) return;
        last = ts;
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (const x of buf) sum += (x - 128) ** 2;
        const rms = Math.min(1, Math.sqrt(sum / buf.length) / 40);
        setLevels((l) => [...l.slice(1), Math.max(0.08, rms)]);
      };
      raf.current = requestAnimationFrame(tick);
    } catch {}

    // الكلام بيظهر وانت بتتكلم (كروم وأندرويد وسفاري)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      try {
        const sr = new SR();
        sr.lang = "ar-EG"; sr.continuous = true; sr.interimResults = true;
        sr.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalText.current += `${t} `; else interim += t;
          }
          setLive(`${finalText.current}${interim}`.trim());
        };
        sr.onend = () => { if (speech.current === sr && rec.current?.state === "recording") { try { sr.start(); } catch {} } };
        sr.onerror = () => {};
        sr.start();
        speech.current = sr;
      } catch {}
    }

    setSec(0);
    const t0 = Date.now();
    timer.current = setInterval(() => {
      const n = (Date.now() - t0) / 1000;
      setSec(n);
      if (n >= MAX_SEC) stop();
    }, 250);
    setStage("rec");
  }

  function stop() {
    clearInterval(timer.current);
    const sr = speech.current;
    speech.current = null;
    try { sr?.stop(); } catch {}
    if (rec.current?.state === "recording") rec.current.stop();
  }

  async function finish(mime) {
    const liveNow = `${finalText.current}`.trim() || live;
    cleanup();
    const blob = new Blob(chunks.current, { type: mime });
    await transcribe(new File([blob], `voice.${extFor(mime)}`, { type: mime.split(";")[0] }), liveNow);
  }

  async function transcribe(file, fallback = "") {
    setStage("stt"); setError("");
    try {
      const fd = new FormData();
      fd.append("audio", file);
      const r = await fetch("/api/transcribe", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "ما قدرناش نسمع التسجيل.");
      setText(j.text);
      setStage("text");
    } catch (e) {
      if (fallback.split(/\s+/).length >= 4) { setText(fallback); setStage("text"); return; }
      setError(e.message);
      setStage("idle");
    }
  }

  function onUpload(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 4_000_000) { setError("الفويس أكبر من 4 ميجا. ارفع حاجة أقصر."); return; }
    setPack(null);
    transcribe(f);
  }

  async function write() {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/ad-pack", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "voice", info: text, contact }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "حصلت مشكلة. جرّب تاني.");
      setPack(j);
      setStage("pack");
      setTimeout(() => packRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  const recording = stage === "rec";
  return (
    <div className={s.body}>
      <section className={`${s.card} ${v.stage} ${stage === "text" || stage === "pack" ? v.write : ""}`}>
        {stage !== "text" && stage !== "pack" ? (
          <>
            <div className={v.prompts} aria-label="اتكلم عن">
              <span>اتكلم عن:</span>
              {PROMPTS.map((x) => <b key={x}>{x}</b>)}
            </div>

            <div className={`${v.micWrap} ${recording ? v.on : ""}`}>
              <i className={v.ring} aria-hidden="true" /><i className={`${v.ring} ${v.r2}`} aria-hidden="true" />
              <button type="button" className={v.mic} onClick={recording ? stop : start} disabled={stage === "stt"} aria-label={recording ? "وقّف التسجيل" : "ابدأ التسجيل"}>
                {stage === "stt" ? <span className={`${s.spin} ${v.micSpin}`} /> : recording ? (
                  <svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" /></svg>
                )}
              </button>
            </div>

            <div className={v.bars} aria-hidden="true">
              {levels.map((l, i) => <i key={i} style={{ transform: `scaleY(${recording ? l : 0.08})` }} />)}
            </div>

            <p className={v.status} role="status">
              {stage === "stt" ? "بنفرّغ كلامك… ثواني" : recording ? <><b className={v.dot} />بيسجّل {fmt(sec)} <small>/ {fmt(MAX_SEC)}</small></> : "اضغط واتكلم براحتك بالمصري، زي ما بتشرح لزبون"}
            </p>
            {recording && <p className={v.live} dir="auto">{live || "…"}</p>}
            {recording && <button type="button" className={s.cta} onClick={stop}>خلصت ✓</button>}

            {stage === "idle" && (
              <div className={v.alt}>
                <label className={s.miniBtn} style={{ position: "relative" }}>
                  <input type="file" accept="audio/*,.ogg,.opus,.m4a,.mp3,.wav,.webm,.aac" onChange={onUpload} style={{ position: "absolute", inset: 0, opacity: 0 }} aria-label="ارفع فويس" />
                  📎 ارفع فويس من واتساب
                </label>
                <button type="button" className={s.miniBtn} onClick={() => { setText(""); setStage("text"); }}>⌨️ أكتب بإيدي</button>
              </div>
            )}
          </>
        ) : (
          <>
            <h2>ده كلامك مكتوب</h2>
            <p className={v.hint}>صحّح أي كلمة اتسمعت غلط، وزوّد أي حاجة نسيتها.</p>
            <textarea className={s.textarea} dir="auto" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} placeholder="اكتب عن المنتج: اسمه وسعره ومميزاته والشحن وإزاي يطلب…" aria-label="الكلام" />
            <div className={s.field} style={{ marginTop: 12 }}>
              <label className={s.label} htmlFor="vp-contact"><span>رقم الطلب أو اسم الصفحة</span><small>اختياري</small></label>
              <input id="vp-contact" className={s.input} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="01012345678" maxLength={60} dir="auto" />
            </div>
            <button type="button" className={s.cta} onClick={write} disabled={busy || text.trim().split(/\s+/).length < 3}>
              {busy ? <><span className={s.spin} /> بنكتب البوستات…</> : stage === "pack" ? "✍️ اكتب نسخة تانية" : "✍️ حوّله لبوستات جاهزة"}
            </button>
            <button type="button" className={`${s.miniBtn} ${v.again}`} onClick={() => { setStage("idle"); setPack(null); setText(""); }}>🎙️ سجّل من الأول</button>
          </>
        )}
        {error && <p className={s.err} role="alert">{error}</p>}
      </section>

      {pack && (
        <section className={s.card} ref={packRef} style={{ scrollMarginTop: 80 }}>
          <h2>البوستات جاهزة</h2>
          <AdPack pack={pack} />
        </section>
      )}

      <section className={s.card}>
        <div className={s.next}>
          <Link href="/photo-ad" className={s.nextCard}><i aria-hidden="true">📸</i><span><b>صوّرها بموبايلك</b><small>صور شكل الاستوديو لنفس المنتج</small></span></Link>
          <Link href="/test-ad" className={s.nextCard}><i aria-hidden="true">👥</i><span><b>جرّب إعلانك على 100 زبون</b><small>قبل ما تدفع فيه</small></span></Link>
        </div>
      </section>
    </div>
  );
}
