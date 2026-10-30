"use client";
// مصنع الفيديو: كل مشهد = فيديو خلفية + تعليق صوتي + كلام مكتوب. التصدير بيتم في متصفح العميل.
import { AbsoluteFill, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Video, Audio } from "@remotion/media";
import { THEMES, FPS, SIZE, toLines, lineImage } from "./ReelComp";

export { FPS, SIZE };

function Caption({ text, theme, font, frames }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 3, fps, config: { damping: 14, stiffness: 150 } });
  const out = interpolate(frame, [frames - 6, frames], [1, 0], { extrapolateLeft: "clamp" });
  const lines = toLines(text, 18).slice(0, 5);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, bottom: 230, display: "flex", justifyContent: "center", opacity: Math.min(s, out), transform: `translateY(${(1 - s) * 40}px)` }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 26px", borderRadius: 28, background: "rgba(0,0,0,0.55)" }}>
        {lines.map((l, i) => {
          const im = lineImage(l, i === 0 ? theme.accent : "#ffffff", font, 64, 800);
          const k = Math.min(1, 560 / im.w);
          return <Img key={i} src={im.src} style={{ width: im.w * k, height: im.h * k }} />;
        })}
      </div>
    </div>
  );
}

function SceneView({ scene, theme, font, frames }) {
  const frame = useCurrentFrame();
  const fade = Math.min(interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" }), interpolate(frame, [frames - 6, frames], [1, 0], { extrapolateLeft: "clamp" }));
  const zoom = 1 + (frame / frames) * 0.06; // حركة هادية على الخلفية
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {scene.video ? (
        <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
          <Video src={scene.video} muted loop objectFit="cover" style={{ width: SIZE.w, height: SIZE.h }} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0) 30%, rgba(0,0,0,0.5))" }} />
      <Caption text={scene.text} theme={theme} font={font} frames={frames} />
      {scene.audio ? <Audio src={scene.audio} /> : null}
    </AbsoluteFill>
  );
}

export function sceneFrames(scene) {
  return Math.max(2 * FPS, Math.ceil(((scene.dur || 3.2) + 0.5) * FPS));
}

export function totalFrames(scenes) {
  return Math.max(1, scenes.reduce((n, s) => n + sceneFrames(s), 0));
}

export function FactoryComp({ scenes = [], themeId = "royal", handle = "", font = "system-ui, sans-serif" }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  let at = 0;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${160 + frame * 0.2}deg, ${theme.c1}, ${theme.c2})` }}>
      {scenes.map((sc, i) => {
        const f = sceneFrames(sc);
        const from = at;
        at += f;
        return (
          <Sequence key={sc.id || i} from={from} durationInFrames={f}>
            <SceneView scene={sc} theme={theme} font={font} frames={f} />
          </Sequence>
        );
      })}
      {handle ? (() => { const im = lineImage(handle, "#ffffff", font, 34); return <Img src={im.src} style={{ position: "absolute", bottom: 110, left: (SIZE.w - im.w) / 2, width: im.w, height: im.h, opacity: 0.85 }} />; })() : null}
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: theme.accent }} />
    </AbsoluteFill>
  );
}
