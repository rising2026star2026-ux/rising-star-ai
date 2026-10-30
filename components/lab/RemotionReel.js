"use client";
// تجربة: ريلز بـ Remotion. المعاينة بالـ Player، والتصدير بيتم في متصفح العميل (WebCodecs) من غير أي سيرفر.
import { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { ReelComp, THEMES, FPS, SIZE } from "./ReelComp";
import { TEMPLATES, getTemplate } from "./templates";
import s from "@/components/studio/studio.module.css";
import { siteFont, ensureFont } from "@/components/studio/util";
import { parseScript } from "@/components/studio/VideoMaker";


async function pickContainer() {
  try {
    if (typeof VideoEncoder !== "undefined") {
      const r = await VideoEncoder.isConfigSupported({ codec: "avc1.640028", width: SIZE.w, height: SIZE.h, bitrate: 4_000_000, framerate: FPS });
      if (r.supported) return "mp4";
    }
  } catch {}
  return "webm";
}

export default function RemotionReel() {
  const [tplId, setTplId] = useState("tips");
  const [text, setText] = useState(TEMPLATES[0].sample.join("\n"));
  const [themeId, setThemeId] = useState("royal");
  const [secs, setSecs] = useState(3);
  const [handle, setHandle] = useState("");
  const [prog, setProg] = useState(null);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");
  const ctl = useRef(null);
  const [font, setFont] = useState(null);
  const [topic, setTopic] = useState("");
  const [writing, setWriting] = useState(false);
  useEffect(() => { ensureFont(800).then(() => setFont(siteFont())); }, []);

  const scenes = useMemo(() => text.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 10), [text]);
  const frames = Math.max(1, scenes.length) * Math.round(secs * FPS);
  const props = useMemo(() => ({ scenes, layout: getTemplate(tplId).layout, themeId, secondsPerScene: secs, handle, font: font || "system-ui, sans-serif" }), [scenes, tplId, themeId, secs, handle, font]);
  const supported = typeof window !== "undefined" && typeof VideoEncoder !== "undefined";

  function pickTemplate(t) {
    const cur = getTemplate(tplId);
    // لو العميل ما غيّرش المثال، نبدّله بمثال القالب الجديد
    if (text.trim() === cur.sample.join("\n")) setText(t.sample.join("\n"));
    setTplId(t.id);
  }

  async function writeScript() {
    if (!topic.trim() || writing) return;
    setWriting(true); setErr("");
    try {
      const res = await fetch("/api/reel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, goal: "tips", dialect: "egy", count: 6 }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "حصلت مشكلة. جرّب تاني."); }
      const lines = parseScript(await res.text());
      if (!lines.length) throw new Error("ما طلعش سكريبت مناسب. اكتب الفكرة بتفاصيل أكتر.");
      setText(lines.join("\n"));
    } catch (e) { setErr(e.message); }
    setWriting(false);
  }

  async function render() {
    setErr(""); setOut(null); setProg(0);
    ctl.current = new AbortController();
    try {
      const { renderMediaOnWeb } = await import("@remotion/web-renderer");
      const container = await pickContainer();
      const { getBlob } = await renderMediaOnWeb({
        composition: { id: "reel", component: ReelComp, durationInFrames: frames, fps: FPS, width: SIZE.w, height: SIZE.h },
        inputProps: props,
        container,
        onProgress: (p) => setProg(p.progress ?? 0),
        signal: ctl.current.signal,
      });
      const blob = await getBlob();
      setOut({ url: URL.createObjectURL(blob), ext: container, size: blob.size });
    } catch (e) {
      if (!ctl.current?.signal.aborted) setErr(String(e?.message || e));
    }
    setProg(null);
  }

  return (
    <div className={s.root}>
      <span className={s.badge}><i />من غير حد، والفيديو بيتعمل على جهازك</span>
      <div className={s.bench}>
        <div className={s.stage}>
          <div style={{ width: "100%", maxWidth: 300 }}>
            {font && <div dir="ltr"><Player component={ReelComp} inputProps={props} durationInFrames={frames} fps={FPS} compositionWidth={SIZE.w} compositionHeight={SIZE.h} controls loop style={{ width: "100%", borderRadius: 14 }} /></div>}
          </div>
        </div>
        <div className={s.panel}>
          <div className={s.section}>
            <span className={s.sectionTitle}>القالب</span>
            <div className={s.presets}>
              {TEMPLATES.map((t) => (
                <button key={t.id} type="button" className={`${s.preset} ${tplId === t.id ? s.presetOn : ""}`} onClick={() => pickTemplate(t)} data-tpl={t.id} title={t.desc}>
                  {t.name}
                </button>
              ))}
            </div>
            <span className={s.meta}>{getTemplate(tplId).desc}</span>
            <span className={s.sectionTitle}>فكرة الفيديو (اختياري)</span>
            <input className={s.input} dir="auto" placeholder="مثال: 5 نصايح لتوفير فلوس المرتب" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={300} aria-label="فكرة الفيديو" />
            <button type="button" className="btn ghost" onClick={writeScript} disabled={!topic.trim() || writing}>{writing ? "بيكتب..." : "اكتب السكريبت بالذكاء الاصطناعي"}</button>
            <span className={s.sectionTitle}>المشاهد (سطر لكل مشهد، لحد 10)</span>
            <textarea className={s.input} rows={6} dir="auto" value={text} onChange={(e) => setText(e.target.value)} aria-label="المشاهد" />
            <div className={s.presets}>
              {THEMES.map((t) => (
                <button key={t.id} type="button" className={`${s.preset} ${themeId === t.id ? s.presetOn : ""}`} onClick={() => setThemeId(t.id)}>
                  <span className={s.swatchDot} style={{ background: `linear-gradient(135deg, ${t.c1}, ${t.c2})`, boxShadow: `inset -10px 0 0 ${t.accent}` }} />
                  {t.name}
                </button>
              ))}
            </div>
            <label className={s.meta}>مدة كل مشهد: {secs} ث
              <input type="range" min={2} max={5} step={0.5} value={secs} onChange={(e) => setSecs(Number(e.target.value))} style={{ width: "100%", direction: "ltr" }} aria-label="مدة المشهد" />
            </label>
            <input className={s.input} dir="auto" placeholder="@حسابك (اختياري)" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={40} />
          </div>
          <div className={s.panelFoot}>
            {!supported && <p className={s.meta}>المتصفح ده مش بيدعم التصدير (محتاج Chrome حديث أو Safari 26).</p>}
            {prog !== null ? (
              <p className={s.meta} role="status">بيتصدّر... {Math.round(prog * 100)}%</p>
            ) : (
              <button type="button" className="btn" id="rm-render" onClick={render} disabled={!supported || !scenes.length || !font}>صدّر الفيديو ({Math.round(frames / FPS)} ث)</button>
            )}
            {out && (
              <>
                <video src={out.url} controls playsInline style={{ width: "100%", borderRadius: 12 }} id="rm-video" />
                <a className="btn" href={out.url} download={`rising-star-reel.${out.ext}`} id="rm-dl">تحميل ({out.ext.toUpperCase()} · {(out.size / 1024).toFixed(0)} KB)</a>
              </>
            )}
            {err && <p className={s.meta} style={{ color: "var(--danger)" }} id="rm-err">{err}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
