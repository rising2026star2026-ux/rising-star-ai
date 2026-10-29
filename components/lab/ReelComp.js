"use client";
// قالب ريلز بـ Remotion: خلفية متحركة، كلمات بتظهر واحدة واحدة، شريط تقدم، وانتقال بين المشاهد.
// بنستخدم عناصر HTML/CSS بسيطة بس (div وtext وgradient وtransform) عشان المُصدّر داخل المتصفح بيدعم مجموعة محدودة.
import { AbsoluteFill, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const FPS = 30;
export const SIZE = { w: 720, h: 1280 };

export const THEMES = [
  { id: "royal", name: "أزرق ملكي", c1: "#06102e", c2: "#2546a8", text: "#ffffff", accent: "#ffd166" },
  { id: "gold", name: "ذهبي فاخر", c1: "#0d0b08", c2: "#3a2c10", text: "#f6ecd2", accent: "#e0b65a" },
  { id: "violet", name: "بنفسجي", c1: "#140a2e", c2: "#5b34c9", text: "#ffffff", accent: "#7ef0d2" },
  { id: "sunset", name: "غروب", c1: "#3a0f1f", c2: "#ff6a4d", text: "#ffffff", accent: "#ffe08a" },
];

// المُصدّر داخل المتصفح بيقيس عرض كل عنصر لوحده، فالكلمات العربي المنفصلة بتتداخل.
// عشان كده بنقسّم الكلام لسطور (كل سطر نص واحد متصل) ونحرّك السطر كله.
function toLines(text, max = 16) {
  const lines = [];
  let cur = "";
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (cur && (cur + " " + w).length > max) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

// كل سطر بيترسم صورة على كانفاس المتصفح (بيشكّل العربي صح)، وبعدين بنحرّك الصورة.
const cache = new Map();
function lineImage(text, color, font, size = 80) {
  const key = `${text}|${color}|${font}|${size}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const f = `800 ${size}px ${font}`;
  ctx.font = f;
  const w = Math.ceil(ctx.measureText(text).width) + 24;
  const h = Math.ceil(size * 1.45);
  c.width = w; c.height = h;
  ctx.font = f;
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2);
  const out = { src: c.toDataURL("image/png"), w, h };
  cache.set(key, out);
  return out;
}

function Words({ text, theme, font, startOffset = 0 }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const lines = toLines(text);
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {lines.map((line, i) => {
        const s = spring({ frame: frame - startOffset - i * 6, fps, config: { damping: 14, stiffness: 140 } });
        const im = lineImage(line, i === 0 ? theme.accent : theme.text, font);
        const k = Math.min(1, (width - 100) / im.w);
        return <Img key={i} src={im.src} style={{ width: im.w * k, height: im.h * k, opacity: s, transform: `translateY(${(1 - s) * 50}px)` }} />;
      })}
    </div>
  );
}

function SceneView({ text, index, total, theme, frames, font }) {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [frames - 8, frames], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: Math.min(fadeIn, fadeOut) }}>
      <div style={{ position: "absolute", top: 120, display: "flex", gap: 10 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ width: i === index ? 54 : 18, height: 10, borderRadius: 6, background: i === index ? theme.accent : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>
      <Words text={text} theme={theme} font={font} startOffset={4} />
    </AbsoluteFill>
  );
}

export function ReelComp({ scenes = [], themeId = "royal", secondsPerScene = 3, handle = "", font = "system-ui, sans-serif" }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const per = Math.round(secondsPerScene * FPS);
  const angle = 160 + frame * 0.25;
  const progress = frame / durationInFrames;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${angle}deg, ${theme.c1}, ${theme.c2})`, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: 350, left: -180 + Math.sin(frame / 40) * 60, top: 740 + Math.cos(frame / 50) * 50, background: `radial-gradient(circle, ${theme.accent}55, transparent 70%)` }} />
      {scenes.map((t, i) => (
        <Sequence key={i} from={i * per} durationInFrames={per}>
          <SceneView text={t} index={i} total={scenes.length} theme={theme} frames={per} font={font} />
        </Sequence>
      ))}
      {handle ? (() => { const im = lineImage(handle, theme.text, font, 34); return <Img src={im.src} style={{ position: "absolute", bottom: 90, left: (720 - im.w) / 2, width: im.w, height: im.h, opacity: 0.8 }} />; })() : null}
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 10, width: `${progress * 100}%`, background: theme.accent }} />
    </AbsoluteFill>
  );
}
