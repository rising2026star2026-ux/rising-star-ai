"use client";
// تجربة: ريلز بـ Remotion. المعاينة بالـ Player، والتصدير بيتم في متصفح العميل (WebCodecs) من غير أي سيرفر.
import { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { ReelComp, THEMES, FPS, SIZE } from "./ReelComp";
import s from "@/components/studio/studio.module.css";
import { siteFont, ensureFont } from "@/components/studio/util";

const SAMPLE = "3 حاجات بتضيّع وقتك كل يوم\nالموبايل أول ما تصحى\nمهام من غير ترتيب\nاجتماعات تكفيها رسالة\nابدأ بكره من أول سطر";

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
  const [text, setText] = useState(SAMPLE);
  const [themeId, setThemeId] = useState("royal");
  const [secs, setSecs] = useState(3);
  const [handle, setHandle] = useState("");
  const [prog, setProg] = useState(null);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");
  const ctl = useRef(null);
  const [font, setFont] = useState(null);
  useEffect(() => { ensureFont(800).then(() => setFont(siteFont())); }, []);

  const scenes = useMemo(() => text.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 10), [text]);
  const frames = Math.max(1, scenes.length) * Math.round(secs * FPS);
  const props = useMemo(() => ({ scenes, themeId, secondsPerScene: secs, handle, font: font || "system-ui, sans-serif" }), [scenes, themeId, secs, handle, font]);
  const supported = typeof window !== "undefined" && typeof VideoEncoder !== "undefined";

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
      <span className={s.badge}><i />تجربة Remotion: التصدير على جهازك</span>
      <div className={s.bench}>
        <div className={s.stage}>
          <div style={{ width: "100%", maxWidth: 300 }}>
            {font && <Player component={ReelComp} inputProps={props} durationInFrames={frames} fps={FPS} compositionWidth={SIZE.w} compositionHeight={SIZE.h} controls loop style={{ width: "100%", borderRadius: 14 }} />}
          </div>
        </div>
        <div className={s.panel}>
          <div className={s.section}>
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
