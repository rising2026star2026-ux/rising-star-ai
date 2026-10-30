"use client";
// مصنع الفيديو: فكرة ← سكريبت ← صوت ← فيديوهات ← معاينة ← تصدير. كله بيتصدّر عند العميل (ما فيش Render على السيرفر).
import { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { FactoryComp, FPS, SIZE, sceneFrames, totalFrames } from "./FactoryComp";
import { THEMES } from "./ReelComp";
import { VOICES } from "@/lib/voices";
import { siteFont, ensureFont } from "@/components/studio/util";
import { callSpace, fileUrl } from "@/lib/hfspace";
import s from "./factory.module.css";

let uid = 0;
const nid = () => `s${++uid}`;

async function pickContainer() {
  try {
    if (typeof VideoEncoder !== "undefined") {
      const r = await VideoEncoder.isConfigSupported({ codec: "avc1.640028", width: SIZE.w, height: SIZE.h, bitrate: 4_000_000, framerate: FPS });
      if (r.supported) return "mp4";
    }
  } catch {}
  return "webm";
}

function audioDuration(url) {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) ? a.duration : null);
    a.onerror = () => resolve(null);
    a.src = url;
  });
}

// يشغّل مهام بالتوازي لكن بحد أقصى (عشان ما نزحمش الشبكة ولا حدود الخدمات المجانية)
async function pool(items, limit, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; await fn(items[k], k); }
  }));
}

export default function VideoFactory() {
  const [topic, setTopic] = useState("");
  const [voice, setVoice] = useState("ar-EG-SalmaNeural");
  const [themeId, setThemeId] = useState("royal");
  const [handle, setHandle] = useState("");
  const [scenes, setScenes] = useState([]);
  const [sel, setSel] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notes, setNotes] = useState([]);
  const [prog, setProg] = useState(null);
  const [out, setOut] = useState(null);
  const [font, setFont] = useState(null);
  const ctl = useRef(null);
  const urls = useRef([]);
  useEffect(() => { ensureFont(800).then(() => setFont(siteFont())); return () => urls.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const keep = (blob) => { const u = URL.createObjectURL(blob); urls.current.push(u); return u; };
  const supported = typeof window !== "undefined" && typeof VideoEncoder !== "undefined";
  const frames = totalFrames(scenes);
  const props = useMemo(() => ({ scenes, themeId, handle, font: font || "system-ui, sans-serif" }), [scenes, themeId, handle, font]);
  const patch = (id, p) => setScenes((all) => all.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const addNote = (m) => setNotes((n) => (n.includes(m) ? n : [...n, m]));

  // صوت بديل مجاني لو خدمة الصوت الأساسية وقفت: Chatterbox على Hugging Face (بحصة الزائر نفسه)
  async function backupVoice(text) {
    try {
      const lang = voice.startsWith("en-") ? "en" : "ar";
      const { out: data, base } = await callSpace("https://resembleai-chatterbox-multilingual-tts.hf.space", "generate_tts_audio", [text.slice(0, 280), lang, null, 0.5, 0.8, 7, 0.5], { signal: ctl.current?.signal });
      const src = fileUrl(data?.[0], base);
      if (!src) return null;
      const r = await fetch(src, { signal: ctl.current?.signal });
      if (!r.ok) return null;
      const url = keep(await r.blob());
      const dur = await audioDuration(url);
      addNote("الصوت الأساسي مش متاح دلوقتي، فاستخدمنا صوت بديل مجاني (أبطأ وصوته مش ثابت بين المشاهد).");
      return { audio: url, dur };
    } catch (e) {
      if (e?.name === "AbortError") throw e;
      console.error("BACKUP", e?.quota ? "quota" : "busy", String(e?.message || e).slice(0, 160));
      if (e?.quota) addNote("حصتك المجانية من الصوت البديل خلصت النهارده. جرّب بكرة أو لما الصوت الأساسي يرجع.");
      return null;
    }
  }

  async function makeVoice(text) {
    try {
      const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, voice }), signal: ctl.current?.signal });
      if (r.ok) {
        const blob = await r.blob();
        const url = keep(blob);
        const dur = await audioDuration(url);
        return { audio: url, dur };
      }
    } catch (e) { if (e?.name === "AbortError") throw e; }
    return await backupVoice(text);
  }

  async function fetchClip(item) {
    try {
      const r = await fetch(item.url, { signal: ctl.current?.signal });
      if (!r.ok) return null;
      return keep(await r.blob());
    } catch (e) { if (e?.name === "AbortError") throw e; return null; }
  }

  async function findClips(kw) {
    try {
      const r = await fetch(`/api/pexels?q=${encodeURIComponent(kw)}&n=3`, { signal: ctl.current?.signal });
      if (r.status === 503) { addNote("فيديوهات Pexels مش مفعّلة لسه (مفتاح PEXELS_API_KEY ناقص)، فالمشاهد بخلفية ملونة."); return []; }
      if (!r.ok) return [];
      return (await r.json()).items || [];
    } catch (e) { if (e?.name === "AbortError") throw e; return []; }
  }

  async function make() {
    if (!topic.trim() || busy) return;
    setBusy(true); setErr(""); setOut(null); setNotes([]); setScenes([]); setSel(0);
    ctl.current = new AbortController();
    try {
      setStatus("بكتب السكريبت…");
      const r = await fetch("/api/vscript", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, count: 6, dialect: "egy" }), signal: ctl.current.signal });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "حصلت مشكلة في كتابة السكريبت.");
      const list = (await r.json()).scenes.map((x) => ({ id: nid(), text: x.text, kw: x.kw, clips: [], clipIdx: 0, video: null, audio: null, dur: null }));
      setScenes(list);
      let done = 0;
      let ttsFail = 0;
      setStatus(`بجهّز الصوت والفيديوهات (0/${list.length})…`);
      await pool(list, 3, async (sc) => {
        const [v, clips] = await Promise.all([makeVoice(sc.text), findClips(sc.kw)]);
        if (!v) ttsFail++;
        let video = null;
        if (clips[0]) video = await fetchClip(clips[0]);
        patch(sc.id, { ...(v || {}), clips, clipIdx: 0, video });
        setStatus(`بجهّز الصوت والفيديوهات (${++done}/${list.length})…`);
      });
      if (ttsFail) addNote(`الصوت ما اشتغلش في ${ttsFail} مشهد. اضغط «حدّث الصوت» على المشهد، أو أعد المحاولة بعد شوية.`);
      setStatus("");
    } catch (e) {
      if (e?.name !== "AbortError") setErr(e.message || "حصلت مشكلة. جرّب تاني.");
      setStatus("");
    }
    setBusy(false);
  }

  async function refreshVoice(sc) {
    ctl.current = new AbortController();
    patch(sc.id, { busyVoice: true });
    const v = await makeVoice(sc.text);
    patch(sc.id, { ...(v || {}), busyVoice: false });
    if (!v) addNote("الصوت لسه مش بيشتغل دلوقتي. جرّب بعد شوية.");
  }

  async function pickClip(sc, idx) {
    ctl.current = new AbortController();
    patch(sc.id, { clipIdx: idx, busyClip: true });
    const video = await fetchClip(sc.clips[idx]);
    patch(sc.id, { video, busyClip: false });
  }

  function removeScene(id) {
    setScenes((all) => all.filter((x) => x.id !== id));
    setSel(0);
  }

  async function render() {
    setErr(""); setOut(null); setProg(0);
    ctl.current = new AbortController();
    try {
      const { renderMediaOnWeb } = await import("@remotion/web-renderer");
      const container = await pickContainer();
      const { getBlob } = await renderMediaOnWeb({
        composition: { id: "factory", component: FactoryComp, durationInFrames: frames, fps: FPS, width: SIZE.w, height: SIZE.h },
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

  const cur = scenes[sel];
  const credits = scenes.map((x) => x.clips[x.clipIdx]).filter(Boolean);
  const ready = scenes.length > 0 && !busy;

  return (
    <div className={s.root} id="vf-root">
      <span className={s.badge}><i />الصوت والفيديو والتصدير بيتعملوا بدون أي سيرفر تصدير، والفيديو بيتحفظ على جهازك</span>

      <div className={s.ask}>
        <input className={s.input} dir="auto" placeholder="اكتب فكرة الفيديو: مثلاً «فوايد القهوة»" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={300} id="vf-topic" aria-label="فكرة الفيديو" onKeyDown={(e) => e.key === "Enter" && make()} />
        <button type="button" className="btn" onClick={make} disabled={!topic.trim() || busy} id="vf-make">{busy ? "بيشتغل…" : "اصنع الفيديو"}</button>
      </div>
      <div className={s.opts}>
        <select className={s.input} value={voice} onChange={(e) => setVoice(e.target.value)} aria-label="الصوت" id="vf-voice">
          {Object.entries(VOICES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className={s.themes}>
          {THEMES.map((t) => (
            <button key={t.id} type="button" className={`${s.dot} ${themeId === t.id ? s.dotOn : ""}`} onClick={() => setThemeId(t.id)} title={t.name} aria-label={t.name} style={{ background: `linear-gradient(135deg, ${t.c1}, ${t.c2})`, boxShadow: `inset -8px 0 0 ${t.accent}` }} />
          ))}
        </div>
        <input className={s.input} dir="auto" placeholder="@حسابك (اختياري)" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={40} />
      </div>
      {status && <p className={s.status} role="status" id="vf-status">{status}</p>}
      {err && <p className={s.err} id="vf-err">{err}</p>}
      {notes.map((n) => <p key={n} className={s.note}>{n}</p>)}

      {scenes.length > 0 && (
        <>
          <div className={s.preview} data-vf="preview">
            {font && <div dir="ltr"><Player component={FactoryComp} inputProps={props} durationInFrames={frames} fps={FPS} compositionWidth={SIZE.w} compositionHeight={SIZE.h} controls loop style={{ width: "100%", borderRadius: 16 }} /></div>}
          </div>

          <div className={s.timeline} role="list" aria-label="المشاهد">
            {scenes.map((sc, i) => (
              <button key={sc.id} type="button" role="listitem" className={`${s.clip} ${i === sel ? s.clipOn : ""}`} onClick={() => setSel(i)} style={{ flexBasis: Math.max(86, sceneFrames(sc) * 2.4) }} data-scene={i}>
                {sc.clips[sc.clipIdx]?.thumb ? <img src={sc.clips[sc.clipIdx].thumb} alt="" /> : <span className={s.noThumb} />}
                <b>{i + 1}</b>
                <small>{(sceneFrames(sc) / FPS).toFixed(1)}ث{sc.audio ? " 🔊" : ""}</small>
              </button>
            ))}
          </div>

          {cur && (
            <div className={s.editor}>
              <span className={s.label}>كلام المشهد {sel + 1}</span>
              <textarea className={s.input} rows={3} dir="auto" value={cur.text} onChange={(e) => patch(cur.id, { text: e.target.value })} aria-label="كلام المشهد" />
              <div className={s.row}>
                <button type="button" className="btn ghost" onClick={() => refreshVoice(cur)} disabled={cur.busyVoice}>{cur.busyVoice ? "بيحدّث…" : "🔊 حدّث الصوت"}</button>
                {scenes.length > 2 && <button type="button" className="btn ghost" onClick={() => removeScene(cur.id)}>احذف المشهد</button>}
              </div>
              {cur.clips.length > 0 && (
                <>
                  <span className={s.label}>الفيديو (اختار)</span>
                  <div className={s.picks}>
                    {cur.clips.map((c, i) => (
                      <button key={c.id} type="button" className={`${s.pick} ${i === cur.clipIdx ? s.pickOn : ""}`} onClick={() => pickClip(cur, i)} aria-label={`فيديو ${i + 1}`}>
                        <img src={c.thumb} alt="" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className={s.foot}>
            {!supported && <p className={s.note}>المتصفح ده مش بيدعم التصدير (محتاج Chrome حديث أو Safari 26).</p>}
            {prog !== null ? (
              <p className={s.status} role="status" id="vf-prog">بيتصدّر… {Math.round(prog * 100)}%</p>
            ) : (
              <button type="button" className="btn" id="vf-render" onClick={render} disabled={!supported || !ready || !font}>صدّر الفيديو ({Math.round(frames / FPS)} ث)</button>
            )}
            {out && (
              <>
                <video src={out.url} controls playsInline style={{ width: "100%", maxWidth: 320, borderRadius: 12 }} id="vf-video" />
                <a className="btn" href={out.url} download={`rising-star-video.${out.ext}`} id="vf-dl">تحميل ({out.ext.toUpperCase()} · {(out.size / 1048576).toFixed(1)} MB)</a>
              </>
            )}
            {credits.length > 0 && (
              <p className={s.credit}>
                فيديوهات من <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">Pexels</a>:{" "}
                {credits.map((c, i) => (<span key={c.id}>{i ? "، " : ""}<a href={c.page} target="_blank" rel="noopener noreferrer">{c.by || "مصور"}</a></span>))}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
