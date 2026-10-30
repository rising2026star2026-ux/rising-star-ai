"use client";
// فيديو إعلان من صورة المنتج: تعريف ← مميزات ← عرض ← دعوة للشراء. التصدير بيتم في متصفح العميل.
// المُصدّر بيدعم مجموعة محدودة من CSS، فبنستخدم div وgradient وأبعاد صريحة بس (من غير filter ولا object-fit).
import { AbsoluteFill, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { THEMES, toLines, Line } from "./ReelComp";

export const FPS = 30;
export const FORMATS = {
  v: { w: 720, h: 1280, name: "طولي 9:16 (ريلز وستوري)" },
  s: { w: 720, h: 720, name: "مربع 1:1 (إنستجرام وفيسبوك)" },
  h: { w: 1280, h: 720, name: "عرضي 16:9 (يوتيوب)" },
};

// المشاهد حسب البيانات المكتوبة. say = الكلام اللي هيتقال، min = أقل مدة بالثواني
export function planScenes({ name = "", tagline = "", features = [], offer = "", cta = "", handle = "" }) {
  const f = features.map((x) => x.trim()).filter(Boolean).slice(0, 4);
  const list = [{ id: "intro", say: [name.trim(), tagline.trim()].filter(Boolean).join(". "), min: 3.2 }];
  if (f.length) list.push({ id: "features", say: f.join(". "), min: Math.min(6, 1.6 + 1.2 * f.length) });
  if (offer.trim()) list.push({ id: "offer", say: `العرض: ${offer.trim()}`, min: 3 });
  if (cta.trim() || handle.trim()) list.push({ id: "cta", say: cta.trim() || handle.trim(), min: 3.2 });
  return list;
}

export const sceneFrames = (sc) => Math.max(2 * FPS, Math.ceil((sc.d || sc.min || 3) * FPS));
export const totalFrames = (scenes) => Math.max(1, scenes.reduce((n, s) => n + sceneFrames(s), 0));

const lerp = (a, b, t) => a + (b - a) * t;
const lerpRect = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

function layoutFor(W, H) {
  if (W > H * 1.2) {
    const card = { x: 70, y: 80, w: 560, h: 560 };
    const text = { x: 680, y: 60, w: 540, h: 600 };
    return { kind: "land", big: card, small: card, text, textSmall: text, name: 68, sub: 44, feat: 48, offer: 92, cta: 56, chars: 14 };
  }
  if (W === H) {
    return {
      kind: "sq", big: { x: 170, y: 30, w: 380, h: 380 }, small: { x: 260, y: 20, w: 180, h: 180 },
      text: { x: 30, y: 425, w: 660, h: 280 }, textSmall: { x: 30, y: 215, w: 660, h: 490 },
      name: 58, sub: 38, feat: 42, offer: 80, cta: 50, chars: 18,
    };
  }
  return {
    kind: "port", big: { x: 60, y: 130, w: 600, h: 600 }, small: { x: 170, y: 70, w: 380, h: 380 },
    text: { x: 40, y: 780, w: 640, h: 430 }, textSmall: { x: 40, y: 480, w: 640, h: 700 },
    name: 78, sub: 50, feat: 54, offer: 96, cta: 58, chars: 15,
  };
}

function Card({ rect, img }) {
  const pad = Math.round(rect.w * 0.06);
  const k = Math.min((rect.w - pad * 2) / img.w, (rect.h - pad * 2) / img.h);
  const w = img.w * k;
  const h = img.h * k;
  return (
    <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: Math.round(rect.w * 0.06), background: "#ffffff", overflow: "hidden" }}>
      <Img src={img.src} style={{ position: "absolute", left: (rect.w - w) / 2, top: (rect.h - h) / 2, width: w, height: h }} />
    </div>
  );
}

function Backdrop({ img, theme, frame, frames }) {
  const { width: W, height: H } = useVideoConfig();
  const k = Math.max(W / img.w, H / img.h) * (1.04 + (frame / frames) * 0.08);
  const w = img.w * k;
  const h = img.h * k;
  return (
    <AbsoluteFill>
      <Img src={img.src} style={{ position: "absolute", left: (W - w) / 2, top: (H - h) / 2, width: w, height: h, opacity: 0.22 }} />
      <AbsoluteFill style={{ background: `linear-gradient(160deg, ${theme.c1}f2, ${theme.c2}e6)` }} />
    </AbsoluteFill>
  );
}

function TextBox({ rect, children }) {
  return (
    <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
      {children}
    </div>
  );
}

function Scene({ sc, idx, data, theme, font, L, frames }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = (delay = 0, cfg = { damping: 14, stiffness: 140 }) => spring({ frame: frame - delay, fps, config: cfg });
  const imgs = data.images;
  const img = imgs[idx % imgs.length];
  const fade = Math.min(idx === 0 ? 1 : interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" }), interpolate(frame, [frames - 6, frames], [1, 0], { extrapolateLeft: "clamp" }));
  const shrink = sc.id === "intro" ? 0 : Math.min(1, sp(0, { damping: 18, stiffness: 120 }));
  const rect = lerpRect(L.big, L.small, shrink);
  const pop = sc.id === "intro" ? 0.85 + 0.15 * Math.min(1, sp(0)) : 1;
  const cardRect = sc.id === "intro" ? { x: rect.x + rect.w * (1 - pop) * 0.5, y: rect.y + rect.h * (1 - pop) * 0.5, w: rect.w * pop, h: rect.h * pop } : rect;
  const tr = sc.id === "intro" ? L.text : L.textSmall;
  const nameLines = toLines(data.name, L.chars).slice(0, L.kind === "port" ? 3 : 2);

  let body = null;
  if (sc.id === "intro") {
    const subLines = toLines(data.tagline || "", L.chars + 6).slice(0, 2);
    body = (
      <TextBox rect={tr}>
        {nameLines.map((l, i) => { const s = sp(8 + i * 5); return <Line key={i} text={l} color={i === 0 ? theme.accent : theme.text} font={font} size={L.name} maxW={tr.w} style={{ opacity: s, transform: `translateY(${(1 - s) * 40}px)` }} />; })}
        {subLines.map((l, i) => { const s = sp(22 + i * 5); return <Line key={`t${i}`} text={l} color="#ffffff" font={font} size={L.sub} weight={600} maxW={tr.w} style={{ opacity: s * 0.9, transform: `translateY(${(1 - s) * 30}px)` }} />; })}
      </TextBox>
    );
  } else if (sc.id === "features") {
    const fs = data.features.map((x) => x.trim()).filter(Boolean).slice(0, 4);
    body = (
      <TextBox rect={tr}>
        {fs.map((t, i) => {
          const s = sp(12 + i * 12);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 22px", borderRadius: 999, background: "rgba(255,255,255,0.14)", opacity: s, transform: `translateX(${(1 - s) * 80}px)` }}>
              <Line text={t.slice(0, 38)} color="#ffffff" font={font} size={L.feat} weight={700} maxW={tr.w - 120} />
              <div style={{ width: 26, height: 26, borderRadius: 13, background: theme.accent, flex: "none" }} />
            </div>
          );
        })}
      </TextBox>
    );
  } else if (sc.id === "offer") {
    const s = sp(8, { damping: 10, stiffness: 120 });
    const lines = toLines(data.offer, L.chars - 4).slice(0, 2);
    body = (
      <TextBox rect={tr}>
        {nameLines.slice(0, 1).map((l, i) => <Line key={i} text={l} color="#ffffff" font={font} size={Math.round(L.name * 0.7)} maxW={tr.w} style={{ opacity: Math.min(1, s * 1.5) }} />)}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "22px 44px", borderRadius: 44, background: theme.accent, transform: `scale(${s}) rotate(${-4 * s}deg)` }}>
          {lines.map((l, i) => <Line key={i} text={l} color={theme.c1} font={font} size={L.offer} weight={900} maxW={tr.w - 100} />)}
        </div>
      </TextBox>
    );
  } else {
    const s = sp(6);
    const pulse = 1 + Math.sin(frame / 6) * 0.025;
    const lines = toLines(data.cta || data.handle, L.chars + 2).slice(0, 3);
    body = (
      <TextBox rect={tr}>
        {data.cta ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 40px", borderRadius: 46, background: theme.accent, opacity: s, transform: `scale(${s * pulse})` }}>
            {lines.map((l, i) => <Line key={i} text={l} color={theme.c1} font={font} size={L.cta} weight={900} maxW={tr.w - 90} />)}
          </div>
        ) : null}
        {data.handle ? <Line text={data.handle} color="#ffffff" font={font} size={Math.round(L.sub * 0.95)} weight={700} maxW={tr.w} style={{ opacity: Math.min(1, s * 1.4), marginTop: 12 }} /> : null}
      </TextBox>
    );
  }

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop img={img} theme={theme} frame={frame} frames={frames} />
      <Card rect={cardRect} img={img} />
      {body}
      {sc.audio ? <Audio src={sc.audio} /> : null}
    </AbsoluteFill>
  );
}

export function AdComp({ scenes = [], images = [], name = "", tagline = "", features = [], offer = "", cta = "", handle = "", themeId = "royal", font = "system-ui, sans-serif" }) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const L = layoutFor(W, H);
  const data = { images, name, tagline, features, offer, cta, handle };
  let at = 0;
  if (!images.length) return <AbsoluteFill style={{ background: theme.c1 }} />;
  return (
    <AbsoluteFill style={{ background: theme.c1 }}>
      {scenes.map((sc, i) => {
        const f = sceneFrames(sc);
        const from = at;
        at += f;
        return (
          <Sequence key={sc.id} from={from} durationInFrames={f}>
            <Scene sc={sc} idx={i} data={data} theme={theme} font={font} L={L} frames={f} />
          </Sequence>
        );
      })}
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: theme.accent }} />
    </AbsoluteFill>
  );
}
