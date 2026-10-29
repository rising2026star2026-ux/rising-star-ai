"use client";
// قالب ريلز بـ Remotion: خلفية متحركة، كلمات بتظهر واحدة واحدة، شريط تقدم، وانتقال بين المشاهد.
// بنستخدم عناصر HTML/CSS بسيطة بس (div وtext وgradient وtransform) عشان المُصدّر داخل المتصفح بيدعم مجموعة محدودة.
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

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
function toLines(text, max = 14) {
  const lines = [];
  let cur = "";
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (cur && (cur + " " + w).length > max) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

function Words({ text, theme, startOffset = 0 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = toLines(text);
  return (
    <div style={{ width: "100%", padding: "0 56px", boxSizing: "border-box" }}>
      {lines.map((line, i) => {
        const s = spring({ frame: frame - startOffset - i * 6, fps, config: { damping: 14, stiffness: 140 } });
        return (
          <div key={i} dir="rtl" style={{ textAlign: "center", fontSize: 80, fontWeight: 800, lineHeight: 1.35, color: i === 0 ? theme.accent : theme.text, opacity: s, transform: `translateY(${(1 - s) * 50}px)`, whiteSpace: "nowrap" }}>
            {line}
          </div>
        );
      })}
    </div>
  );
}

function SceneView({ text, index, total, theme, frames }) {
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
      <Words text={text} theme={theme} startOffset={4} />
    </AbsoluteFill>
  );
}

export function ReelComp({ scenes = [], themeId = "royal", secondsPerScene = 3, handle = "" }) {
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
          <SceneView text={t} index={i} total={scenes.length} theme={theme} frames={per} />
        </Sequence>
      ))}
      {handle ? <div style={{ position: "absolute", bottom: 96, width: "100%", textAlign: "center", fontSize: 34, color: theme.text, opacity: 0.8 }}>{handle}</div> : null}
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 10, width: `${progress * 100}%`, background: theme.accent }} />
    </AbsoluteFill>
  );
}
