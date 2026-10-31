"use client";
// فيديو إعلان 15 ثانية من صور المنتج والكلام اللي اتكتب (Remotion). المعاينة والتصدير على جهاز العميل.
import { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { AdComp, FPS, FORMATS, planScenes, totalFrames } from "@/components/lab/AdComp";
import { THEMES } from "@/components/lab/ReelComp";
import { siteFont, ensureFont } from "@/components/studio/util";
import s from "./seller.module.css";
import p from "./photoad.module.css";

async function pickContainer(f) {
  try {
    if (typeof VideoEncoder !== "undefined") {
      const r = await VideoEncoder.isConfigSupported({ codec: "avc1.640028", width: f.w, height: f.h, bitrate: 4_000_000, framerate: FPS });
      if (r.supported) return "mp4";
    }
  } catch {}
  return "webm";
}

export default function PhotoAdVideo({ images, name, tagline, features, offer, contact }) {
  const [fmt, setFmt] = useState("v");
  const [themeId, setThemeId] = useState("royal");
  const [font, setFont] = useState(null);
  const [prog, setProg] = useState(null);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");
  const ctl = useRef(null);
  useEffect(() => { ensureFont(800).then(() => setFont(siteFont())); }, []);
  useEffect(() => () => { if (out?.url) URL.revokeObjectURL(out.url); }, [out]);

  const cta = "اطلب دلوقتي";
  const plan = useMemo(() => planScenes({ name, tagline, features, offer, cta, handle: contact }), [name, tagline, features, offer, contact]);
  const scenes = useMemo(() => plan.map((x) => ({ id: x.id, min: x.min, d: x.min, audio: null })), [plan]);
  const frames = totalFrames(scenes);
  const F = FORMATS[fmt];
  const props = useMemo(() => ({ scenes, images, name: name.trim(), tagline, features, offer, cta, handle: contact, themeId, font: font || "system-ui, sans-serif" }),
    [scenes, images, name, tagline, features, offer, contact, themeId, font]);
  const supported = typeof window !== "undefined" && typeof VideoEncoder !== "undefined";

  async function render() {
    setErr(""); setOut(null); setProg(0);
    ctl.current = new AbortController();
    try {
      const { renderMediaOnWeb } = await import("@remotion/web-renderer");
      const container = await pickContainer(F);
      const { getBlob } = await renderMediaOnWeb({
        composition: { id: "photo-ad", component: AdComp, durationInFrames: frames, fps: FPS, width: F.w, height: F.h },
        inputProps: props,
        container,
        onProgress: (x) => setProg(x.progress ?? 0),
        signal: ctl.current.signal,
      });
      const blob = await getBlob();
      setOut({ url: URL.createObjectURL(blob), ext: container, size: blob.size });
    } catch (e) {
      if (!ctl.current?.signal.aborted) setErr("التصدير ما اشتغلش على المتصفح ده. جرّب كروم محدّث على الكمبيوتر أو الموبايل.");
    }
    setProg(null);
  }

  if (!font) return <p className={s.ctaNote}>بنجهّز الفيديو…</p>;
  const w = fmt === "h" ? 460 : fmt === "s" ? 340 : 270;
  return (
    <div className={p.video}>
      <div className={p.videoOpts}>
        <div className={s.chips} role="group" aria-label="مقاس الفيديو">
          {[["v", "ريلز وستوري"], ["s", "مربع"], ["h", "يوتيوب"]].map(([k, v]) => (
            <button key={k} type="button" className={s.chip} aria-pressed={fmt === k} onClick={() => { setFmt(k); setOut(null); }}>{v}</button>
          ))}
        </div>
        <div className={p.themes} role="group" aria-label="ألوان الفيديو">
          {THEMES.map((t) => (
            <button key={t.id} type="button" className={`${p.theme} ${themeId === t.id ? p.themeOn : ""}`} onClick={() => setThemeId(t.id)} title={t.name} aria-label={t.name}
              style={{ background: `linear-gradient(135deg, ${t.c1}, ${t.c2})`, boxShadow: `inset -8px 0 0 ${t.accent}` }} />
          ))}
        </div>
      </div>
      <div className={p.player} style={{ width: `min(${w}px, 100%)` }} dir="ltr">
        <Player component={AdComp} inputProps={props} durationInFrames={frames} fps={FPS} compositionWidth={F.w} compositionHeight={F.h}
          controls loop autoPlay initiallyMuted style={{ width: "100%", borderRadius: 18 }} />
      </div>
      {!supported && <p className={s.ctaNote}>المتصفح ده بيعرض الفيديو بس مش بيصدّره. افتح الصفحة من كروم محدّث عشان تنزّله.</p>}
      {prog !== null ? (
        <div className={p.prog} role="status">
          <span>بيتصدّر… {Math.round(prog * 100)}%</span>
          <i style={{ width: `${Math.round(prog * 100)}%` }} />
          <button type="button" className={s.miniBtn} onClick={() => ctl.current?.abort()}>إلغاء</button>
        </div>
      ) : (
        <button type="button" className={s.cta} onClick={render} disabled={!supported}>🎬 صدّر الفيديو ({Math.round(frames / FPS)} ثانية)</button>
      )}
      {err && <p className={s.err}>{err}</p>}
      {out && (
        <div className={p.out}>
          <video src={out.url} controls playsInline />
          <a className={`${s.cta} ${s.blue}`} href={out.url} download={`product-ad.${out.ext}`}>تحميل الفيديو ({(out.size / 1048576).toFixed(1)} ميجا)</a>
        </div>
      )}
    </div>
  );
}
