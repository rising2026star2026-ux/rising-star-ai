"use client";
// ريلز بـ Remotion: 6 تصاميم (layouts) × ألوان. التصدير بيتم في متصفح العميل.
// المُصدّر بيدعم مجموعة محدودة من HTML/CSS، فبنستخدم div وgradient وtransform بس،
// والكلام العربي بيترسم الأول على كانفاس المتصفح (بيشكّله صح) وبنحرّك الصورة.
import { AbsoluteFill, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const FPS = 30;
export const SIZE = { w: 720, h: 1280 };

export const THEMES = [
  { id: "royal", name: "أزرق ملكي", c1: "#06102e", c2: "#2546a8", text: "#ffffff", accent: "#ffd166" },
  { id: "gold", name: "ذهبي فاخر", c1: "#0d0b08", c2: "#3a2c10", text: "#f6ecd2", accent: "#e0b65a" },
  { id: "violet", name: "بنفسجي", c1: "#140a2e", c2: "#5b34c9", text: "#ffffff", accent: "#7ef0d2" },
  { id: "sunset", name: "غروب", c1: "#3a0f1f", c2: "#ff6a4d", text: "#ffffff", accent: "#ffe08a" },
];

export function toLines(text, max = 16) {
  const lines = [];
  let cur = "";
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (cur && (cur + " " + w).length > max) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

const cache = new Map();
export function lineImage(text, color, font, size = 80, weight = 800) {
  const key = `${text}|${color}|${font}|${size}|${weight}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const f = `${weight} ${size}px ${font}`;
  ctx.font = f;
  const w = Math.max(8, Math.ceil(ctx.measureText(text).width) + 24);
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

// صورة سطر بعرض مناسب للشاشة
export function Line({ text, color, font, size = 80, weight = 800, style = {}, maxW = 620 }) {
  const im = lineImage(text, color, font, size, weight);
  const k = Math.min(1, maxW / im.w);
  return <Img src={im.src} style={{ width: im.w * k, height: im.h * k, ...style }} />;
}

const useIn = (delay = 0, config = { damping: 14, stiffness: 140 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (extra = 0) => spring({ frame: frame - delay - extra, fps, config });
};

// ---------- التصاميم ----------
function Words({ text, theme, font }) {
  const sp = useIn(4);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {toLines(text).map((l, i) => {
        const s = sp(i * 6);
        return <Line key={i} text={l} color={i === 0 ? theme.accent : theme.text} font={font} style={{ opacity: s, transform: `translateY(${(1 - s) * 50}px)` }} />;
      })}
    </div>
  );
}

function NumberLayout({ text, index, theme, font }) {
  const sp = useIn(2);
  const s = sp();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ width: 230, height: 230, borderRadius: 115, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${s})`, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        <Line text={String(index + 1)} color={theme.c1} font={font} size={170} maxW={160} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20 }}>
        {toLines(text, 18).map((l, i) => {
          const t = sp2(sp, 10 + i * 6);
          return <Line key={i} text={l} color={theme.text} font={font} size={68} style={{ opacity: t, transform: `translateY(${(1 - t) * 40}px)` }} />;
        })}
      </div>
    </div>
  );
}
const sp2 = (sp, extra) => sp(extra);

function QuoteLayout({ text, theme, font }) {
  const sp = useIn(2);
  const [q, a] = text.split(/\s[—–-]\s/);
  const s = sp();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ opacity: 0.55 * s, transform: `scale(${0.6 + 0.4 * s})`, marginBottom: -30 }}>
        <Line text={"”"} color={theme.accent} font={font} size={300} maxW={200} />
      </div>
      {toLines(q || text, 18).map((l, i) => {
        const t = sp(8 + i * 6);
        return <Line key={i} text={l} color={theme.text} font={font} size={70} weight={700} style={{ opacity: t, transform: `translateY(${(1 - t) * 40}px)` }} />;
      })}
      {a ? (
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", opacity: sp(30) }}>
          <div style={{ width: 120, height: 6, borderRadius: 3, background: theme.accent, marginBottom: 14 }} />
          <Line text={a} color={theme.accent} font={font} size={54} weight={700} />
        </div>
      ) : null}
    </div>
  );
}

function AdLayout({ text, index, total, theme, font }) {
  const sp = useIn(2);
  const frame = useCurrentFrame();
  const first = index === 0;
  const last = index === total - 1 && total > 1;
  if (first) {
    const shake = Math.sin(frame * 1.4) * Math.max(0, 6 - frame / 3);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `translateX(${shake}px)` }}>
        {toLines(text, 13).map((l, i) => {
          const t = sp(i * 5);
          return <Line key={i} text={l} color={i === 0 ? theme.accent : theme.text} font={font} size={96} style={{ opacity: t, transform: `scale(${0.7 + 0.3 * t})` }} />;
        })}
      </div>
    );
  }
  if (last) {
    const pulse = 1 + Math.sin(frame / 5) * 0.04;
    const im = lineImage(text, theme.c1, font, 72);
    const k = Math.min(1, 500 / im.w);
    const s = sp();
    return (
      <div style={{ padding: "26px 56px", borderRadius: 80, background: theme.accent, transform: `scale(${s * pulse})`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <Img src={im.src} style={{ width: im.w * k, height: im.h * k, display: "block" }} />
      </div>
    );
  }
  const x = (1 - sp()) * 500;
  return (
    <div style={{ width: 600, padding: "36px 28px", borderRadius: 40, background: "rgba(255,255,255,0.12)", border: `3px solid ${theme.accent}`, display: "flex", flexDirection: "column", alignItems: "center", transform: `translateX(${x}px)` }}>
      {toLines(text, 18).map((l, i) => <Line key={i} text={l} color={theme.text} font={font} size={64} maxW={540} />)}
    </div>
  );
}

function TypeLayout({ text, frames, theme, font }) {
  const frame = useCurrentFrame();
  const lines = toLines(text, 18);
  const p = interpolate(frame, [6, Math.max(12, frames * 0.7)], [0, lines.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ direction: "ltr", width: 620, padding: "46px 30px", borderRadius: 40, background: "rgba(0,0,0,0.38)", border: "2px solid rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      {lines.map((l, i) => {
        const r = Math.max(0, Math.min(1, p - i));
        const im = lineImage(l, i === lines.length - 1 ? theme.accent : theme.text, font, 62, 700);
        const k = Math.min(1, 560 / im.w);
        const w = im.w * k;
        return (
          <div key={i} style={{ direction: "ltr", width: w * r, height: im.h * k, overflow: "hidden", alignSelf: "flex-end" }}>
            <Img src={im.src} style={{ display: "block", width: w, height: im.h * k, maxWidth: "none", marginLeft: -(w * (1 - r)) }} />
          </div>
        );
      })}
    </div>
  );
}

const toWestern = (s) => s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
function StatsLayout({ text, theme, font, frames }) {
  const frame = useCurrentFrame();
  const sp = useIn(2);
  const m = toWestern(text).match(/\d[\d,.]*/);
  if (!m) return <Words text={text} theme={theme} font={font} />;
  const target = parseFloat(m[0].replace(/,/g, ""));
  const rest = toWestern(text).replace(m[0], "").replace(/\s+/g, " ").trim();
  const t = interpolate(frame, [4, Math.min(frames - 10, 40)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eased = 1 - Math.pow(1 - t, 3);
  const val = Math.round(target * eased);
  const s = sp();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${0.8 + 0.2 * s})`, opacity: s }}>
      <Line text={val.toLocaleString("en")} color={theme.accent} font={font} size={230} maxW={600} />
      <div style={{ width: 160, height: 8, borderRadius: 4, background: theme.text, opacity: 0.5, margin: "10px 0 24px" }} />
      {toLines(rest, 16).map((l, i) => <Line key={i} text={l} color={theme.text} font={font} size={66} />)}
    </div>
  );
}

const LAYOUTS = { words: Words, number: NumberLayout, quote: QuoteLayout, ad: AdLayout, type: TypeLayout, stats: StatsLayout };

function SceneView({ layout, text, index, total, theme, frames, font }) {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [frames - 8, frames], [1, 0], { extrapolateLeft: "clamp" });
  const L = LAYOUTS[layout] || Words;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: Math.min(fadeIn, fadeOut) }}>
      <div style={{ position: "absolute", top: 120, display: "flex", gap: 10 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ width: i === index ? 54 : 18, height: 10, borderRadius: 6, background: i === index ? theme.accent : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>
      <L text={text} index={index} total={total} theme={theme} font={font} frames={frames} />
    </AbsoluteFill>
  );
}

export function ReelComp({ scenes = [], layout = "words", themeId = "royal", secondsPerScene = 3, handle = "", font = "system-ui, sans-serif" }) {
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
          <SceneView layout={layout} text={t} index={i} total={scenes.length} theme={theme} frames={per} font={font} />
        </Sequence>
      ))}
      {handle ? (() => { const im = lineImage(handle, theme.text, font, 34); return <Img src={im.src} style={{ position: "absolute", bottom: 90, left: (720 - im.w) / 2, width: im.w, height: im.h, opacity: 0.8 }} />; })() : null}
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 10, width: `${progress * 100}%`, background: theme.accent }} />
    </AbsoluteFill>
  );
}
