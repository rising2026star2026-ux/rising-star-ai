"use client";
// صانع الفيديو: الفيديو بيترسم جوه متصفح المستخدم، فمفيش أي تكلفة ولا حد للعدد.
// 3 أوضاع: ai (الذكاء الاصطناعي بيكتب المشاهد)، text (كلام متحرك)، photos (فيديو من الصور).
import { useEffect, useRef, useState } from "react";
import { Drop, Range, Seg, ColorField, TextField, Note, Busy, styles as s } from "./ui";
import { IMAGE_TYPES, loadImage, download, siteFont, ensureFont, wrapLines, formatBytes } from "./util";
import { toast } from "@/lib/store";

const SIZES = {
  story: { w: 720, h: 1280, label: "ريلز وستوري 9:16" },
  square: { w: 960, h: 960, label: "مربع 1:1" },
  wide: { w: 1280, h: 720, label: "يوتيوب 16:9" },
};

const THEMES = [
  { name: "ذهبي فاخر", c1: "#0d0b08", c2: "#2b2210", text: "#f6ecd2", accent: "#e0b65a" },
  { name: "أزرق ملكي", c1: "#06102e", c2: "#2546a8", text: "#ffffff", accent: "#ffd166" },
  { name: "بنفسجي", c1: "#140a2e", c2: "#5b34c9", text: "#ffffff", accent: "#7ef0d2" },
  { name: "غروب", c1: "#3a0f1f", c2: "#ff6a4d", text: "#ffffff", accent: "#ffe08a" },
  { name: "أخضر", c1: "#062419", c2: "#17855a", text: "#f2fff8", accent: "#b8f5d0" },
  { name: "أبيض بسيط", c1: "#ffffff", c2: "#e9e9ee", text: "#151515", accent: "#d14b2f" },
];

const SAMPLE = {
  text: ["3 حاجات بتضيّع وقتك كل يوم", "الموبايل أول ما تصحى", "المهام من غير ترتيب", "الاجتماعات اللي ممكن تبقى رسالة", "احفظ الفيديو وابدأ بكره"],
  ai: [],
  photos: [],
};

const FADE = 0.45; // مدة الانتقال بين المشاهد بالثواني
const FPS = 30;

let sid = 0;
const scene = (text = "", img = null) => ({ id: ++sid, text, img });

export default function VideoMaker({ mode = "text" }) {
  const [scenes, setScenes] = useState(() => SAMPLE[mode].map((t) => scene(t)));
  const [size, setSize] = useState("story");
  const [theme, setTheme] = useState(THEMES[0]);
  const [dur, setDur] = useState(mode === "photos" ? 3 : 3.5);
  const [handle, setHandle] = useState("");
  const [bgImgs, setBgImgs] = useState([]);
  const [music, setMusic] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [rec, setRec] = useState(null); // { progress } وقت التصدير
  const [out, setOut] = useState(null); // { url, blob, ext }
  const [scrub, setScrub] = useState(1.2); // المعاينة بتبدأ بعد ما الكلام يظهر
  const [error, setError] = useState("");
  // صانع الريلز
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("tips");
  const [dialect, setDialect] = useState("egy");
  const [count, setCount] = useState(6);
  const [writing, setWriting] = useState(false);

  const canvasRef = useRef(null);
  const loopRef = useRef(null);
  const audioRef = useRef(null);
  const fontRef = useRef("system-ui");

  const total = Math.max(1, scenes.length) * dur;
  const opts = { scenes, size, theme, dur, handle, bgImgs, mode };
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    fontRef.current = siteFont();
    ensureFont(600).then(() => ensureFont(400)).then(() => drawAt(scrub));
    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // إعادة رسم الإطار الحالي لما حاجة تتغير
  useEffect(() => {
    if (!playing && !rec) drawAt(Math.min(scrub, total - 0.01));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, size, theme, dur, handle, bgImgs, scrub]);

  function drawAt(t) {
    const c = canvasRef.current;
    if (!c) return;
    const { w, h } = SIZES[optsRef.current.size];
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    renderFrame(c.getContext("2d"), t, optsRef.current, fontRef.current);
  }

  function stopLoop() {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = null;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }

  function play() {
    if (playing) { stopLoop(); setPlaying(false); return; }
    if (!scenes.length) return;
    setPlaying(true);
    const t0 = performance.now();
    if (music) {
      const a = new Audio(music.url);
      a.volume = 0.8;
      a.play().catch(() => {});
      audioRef.current = a;
    }
    loopRef.current = setInterval(() => {
      const t = (performance.now() - t0) / 1000;
      if (t >= total) { stopLoop(); setPlaying(false); setScrub(1.2); drawAt(1.2); return; }
      drawAt(t);
    }, 1000 / FPS);
  }

  async function exportVideo() {
    setError("");
    if (!scenes.length) return;
    const c = canvasRef.current;
    if (!c?.captureStream || typeof MediaRecorder === "undefined") {
      setError("المتصفح ده مش بيدعم عمل الفيديو. جرّب كروم أو إيدج على الكمبيوتر أو أندرويد.");
      return;
    }
    stopLoop();
    setPlaying(false);
    setOut((o) => { if (o) URL.revokeObjectURL(o.url); return null; });

    const mime = pickMime();
    const stream = c.captureStream(FPS);
    let actx = null;
    let audio = null;
    let gain = null;
    if (music) {
      try {
        actx = new (window.AudioContext || window.webkitAudioContext)();
        audio = new Audio(music.url);
        audio.crossOrigin = "anonymous";
        const src = actx.createMediaElementSource(audio);
        gain = actx.createGain();
        const dest = actx.createMediaStreamDestination();
        src.connect(gain).connect(dest);
        dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
      } catch {
        audio = null;
      }
    }

    const chunks = [];
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: 5_000_000 });
    } catch {
      setError("مقدرتش أبدأ التسجيل في المتصفح ده.");
      return;
    }
    recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    const done = new Promise((r) => { recorder.onstop = r; });

    setRec({ progress: 0 });
    drawAt(0);
    recorder.start(250);
    if (audio) {
      audio.currentTime = 0;
      await actx.resume().catch(() => {});
      audio.play().catch(() => {});
      gain.gain.setValueAtTime(0.9, actx.currentTime);
      gain.gain.setValueAtTime(0.9, actx.currentTime + Math.max(0, total - 1.2));
      gain.gain.linearRampToValueAtTime(0, actx.currentTime + total);
    }
    const t0 = performance.now();
    await new Promise((resolve) => {
      loopRef.current = setInterval(() => {
        const t = (performance.now() - t0) / 1000;
        if (t >= total) { clearInterval(loopRef.current); loopRef.current = null; resolve(); return; }
        drawAt(t);
        setRec({ progress: t / total });
      }, 1000 / FPS);
    });
    drawAt(total - 0.001);
    await new Promise((r) => setTimeout(r, 120));
    recorder.stop();
    await done;
    stream.getTracks().forEach((tr) => tr.stop());
    if (audio) audio.pause();
    if (actx) actx.close().catch(() => {});

    const type = recorder.mimeType || mime || "video/webm";
    const blob = new Blob(chunks, { type: type.split(";")[0] });
    const ext = type.includes("mp4") ? "mp4" : "webm";
    setRec(null);
    if (!blob.size) { setError("الفيديو طلع فاضي. جرّب تاني وخلي الصفحة مفتوحة قدامك."); return; }
    setOut({ url: URL.createObjectURL(blob), blob, ext });
    toast("الفيديو جاهز");
  }

  async function writeScript() {
    if (!topic.trim() || writing) return;
    setWriting(true);
    setError("");
    try {
      const res = await fetch("/api/reel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, goal, dialect, count }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "حصلت مشكلة. جرّب تاني.");
      }
      const text = await res.text();
      const lines = parseScript(text);
      if (!lines.length) throw new Error("ما طلعش سكريبت مناسب. جرّب تكتب الفكرة بتفاصيل أكتر.");
      setScenes(lines.map((l) => scene(l)));
      setScrub(1.2);
      toast("السكريبت جاهز، عدّل فيه براحتك");
    } catch (e) {
      setError(e.message);
    } finally {
      setWriting(false);
    }
  }

  async function addPhotos(files) {
    const imgs = [];
    for (const f of files.slice(0, 20 - scenes.length)) {
      try { imgs.push(await loadImage(f)); } catch {}
    }
    setScenes((x) => [...x, ...imgs.map((im) => scene("", im))]);
  }

  async function addBgs(files) {
    const imgs = [];
    for (const f of files.slice(0, 10)) {
      try { imgs.push(await loadImage(f)); } catch {}
    }
    setBgImgs((x) => [...x, ...imgs].slice(0, 10));
  }

  function setText(id, text) { setScenes((x) => x.map((sc) => (sc.id === id ? { ...sc, text } : sc))); }
  function move(i, d) {
    setScenes((x) => {
      const j = i + d;
      if (j < 0 || j >= x.length) return x;
      const y = [...x];
      [y[i], y[j]] = [y[j], y[i]];
      return y;
    });
  }
  function remove(id) { setScenes((x) => x.filter((sc) => sc.id !== id)); }

  const busy = !!rec;
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  return (
    <div className={s.root}>
      <span className={s.badge}><i />من غير حد، والفيديو بيتعمل على جهازك</span>

      {mode === "ai" && (
        <div className={s.panel}>
          <TextField label="فكرة الفيديو" value={topic} onChange={setTopic} multiline maxLength={600} placeholder="مثال: 5 نصايح لتوفير فلوس المرتب، أو إعلان لمطعم مشويات في المعادي وعرض 20% أول أسبوع" />
          <Seg label="نوع الفيديو" value={goal} options={[["tips", "نصايح"], ["ad", "إعلان"], ["story", "قصة"], ["quote", "تحفيز"]]} onChange={setGoal} />
          <div className={s.row2}>
            <Seg label="اللهجة" value={dialect} options={[["egy", "مصري"], ["fusha", "فصحى"], ["gulf", "خليجي"]]} onChange={setDialect} />
            <Seg label="عدد المشاهد" value={count} options={[[4, "4"], [6, "6"], [8, "8"]]} onChange={setCount} />
          </div>
          {writing ? <Busy text="الذكاء الاصطناعي بيكتب المشاهد..." /> : (
            <button type="button" className="btn" onClick={writeScript} disabled={!topic.trim()}>اكتب السكريبت</button>
          )}
        </div>
      )}

      {mode === "photos" && (
        <Drop accept={IMAGE_TYPES} multiple onFiles={addPhotos} compact={scenes.length > 0} title={scenes.length ? "زوّد صور" : "اسحب صورك هنا (لحد 20 صورة)"} hint="كل صورة مشهد، وتقدر تكتب كلام على أي صورة." />
      )}

      {scenes.length > 0 && (
        <div className={s.bench}>
          <div className={s.stage}>
            <div style={{ display: "grid", gap: 10, justifyItems: "center", width: "100%" }}>
              <canvas ref={canvasRef} aria-label="معاينة الفيديو" style={{ maxHeight: "60vh" }} />
              <div className={s.toolbar} style={{ width: "100%", maxWidth: 420 }}>
                <button type="button" className="btn ghost" onClick={play} disabled={busy}>{playing ? "إيقاف" : "▶ معاينة"}</button>
                <input
                  type="range" min={0} max={total} step={0.05} value={Math.min(scrub, total)}
                  onChange={(e) => { setScrub(Number(e.target.value)); }}
                  disabled={playing || busy} aria-label="مكان المعاينة" style={{ flex: 1, accentColor: "var(--accent)", direction: "ltr" }}
                />
                <span className={s.meta} dir="ltr">{fmt(total)}</span>
              </div>
            </div>
          </div>

          <div className={s.panel}>
            <div className={s.section}>
              <span className={s.sectionTitle}>المشاهد ({scenes.length})</span>
              {scenes.map((sc, i) => (
                <div key={sc.id} className={s.item} style={{ gridTemplateColumns: sc.img ? "44px minmax(0,1fr) auto" : "minmax(0,1fr) auto" }}>
                  {sc.img && <img className={s.thumb} src={sc.img.src} alt="" style={{ width: 44, height: 44 }} />}
                  <textarea
                    className={s.input}
                    rows={2}
                    value={sc.text}
                    maxLength={140}
                    dir="auto"
                    placeholder={mode === "photos" ? "كلام على الصورة (اختياري)" : `المشهد ${i + 1}`}
                    onChange={(e) => setText(sc.id, e.target.value)}
                    aria-label={`المشهد ${i + 1}`}
                  />
                  <div className={s.itemActions}>
                    <button type="button" className={s.mini} onClick={() => move(i, -1)} disabled={i === 0} aria-label="لفوق">↑</button>
                    <button type="button" className={s.mini} onClick={() => remove(sc.id)} aria-label="شيل المشهد">✕</button>
                  </div>
                </div>
              ))}
              {mode !== "photos" && scenes.length < 12 && (
                <button type="button" className="btn ghost" onClick={() => setScenes((x) => [...x, scene("")])}>+ مشهد</button>
              )}
            </div>

            <div className={s.section}>
              <span className={s.sectionTitle}>الشكل</span>
              <Seg value={size} options={Object.entries(SIZES).map(([k, v]) => [k, v.label])} onChange={setSize} />
              <div className={s.presets}>
                {THEMES.map((t) => (
                  <button key={t.name} type="button" className={`${s.preset} ${theme.name === t.name ? s.presetOn : ""}`} onClick={() => setTheme(t)}>
                    <span className={s.swatchDot} style={{ background: `linear-gradient(135deg, ${t.c1}, ${t.c2})`, boxShadow: `inset -10px 0 0 ${t.accent}` }} />
                    {t.name}
                  </button>
                ))}
              </div>
              <ColorField label="لون مميز" value={theme.accent} onChange={(v) => setTheme({ ...theme, accent: v, name: "" })} />
              <Range label="مدة كل مشهد" value={dur} min={2} max={7} step={0.5} format={(v) => `${v} ث`} onChange={setDur} />
              <TextField label="اسمك أو حسابك تحت (اختياري)" value={handle} onChange={setHandle} placeholder="@yourbrand" maxLength={40} dir="auto" />
            </div>

            {mode !== "photos" && (
              <div className={s.section}>
                <span className={s.sectionTitle}>صور خلفية (اختياري)</span>
                <Drop accept={IMAGE_TYPES} multiple compact onFiles={addBgs} title={bgImgs.length ? `${bgImgs.length} صور، زوّد تاني` : "حط صور ورا الكلام"} />
                {bgImgs.length > 0 && <button type="button" className="btn ghost" onClick={() => setBgImgs([])}>شيل صور الخلفية</button>}
              </div>
            )}

            <div className={s.section}>
              <span className={s.sectionTitle}>موسيقى (اختياري)</span>
              <Drop
                accept="audio/*"
                compact
                onFiles={(f) => { if (music) URL.revokeObjectURL(music.url); setMusic({ url: URL.createObjectURL(f[0]), name: f[0].name }); }}
                title={music ? `🎵 ${music.name.slice(0, 28)}` : "حط ملف موسيقى (MP3)"}
              />
              {music && <button type="button" className="btn ghost" onClick={() => { URL.revokeObjectURL(music.url); setMusic(null); }}>شيل الموسيقى</button>}
              <Note>استخدم موسيقى مسموح باستخدامها، زي مكتبة الصوت في يوتيوب أو تيك توك.</Note>
            </div>

            <div className={s.panelFoot}>
              {busy ? (
                <>
                  <Busy text={`بيسجّل الفيديو... ${Math.round(rec.progress * 100)}%`} />
                  <Note>خلي الصفحة دي مفتوحة قدامك لحد ما يخلص (بياخد نفس مدة الفيديو).</Note>
                </>
              ) : (
                <button type="button" className="btn" onClick={exportVideo}>اعمل الفيديو ({fmt(total)})</button>
              )}
              {out && (
                <>
                  <video src={out.url} controls playsInline style={{ width: "100%", borderRadius: 12 }} />
                  <button type="button" className="btn" onClick={() => download(out.blob, `rising-star-video.${out.ext}`)}>
                    تحميل الفيديو ({out.ext.toUpperCase()} · {formatBytes(out.blob.size)})
                  </button>
                  {out.ext === "webm" && <Note>المتصفح ده بيحفظ الفيديو WebM. لو إنستجرام أو واتساب ما قبلوهوش، افتح الأداة من كروم حديث، أو حوّله MP4 من أي موقع تحويل.</Note>}
                </>
              )}
              {error && <Note tone="warn">{error}</Note>}
            </div>
          </div>
        </div>
      )}

      {scenes.length === 0 && error && <Note tone="warn">{error}</Note>}
    </div>
  );
}

/** «عنوان: ...» وبعده «- ...» → قايمة مشاهد */
export function parseScript(text) {
  return String(text)
    .split("\n")
    .map((l) => l.replace(/\*\*/g, "").trim())
    .filter(Boolean)
    .map((l) => l.replace(/^(عنوان|العنوان)\s*[:：]\s*/u, "").replace(/^([-–•*]|\d+[.)-]|مشهد\s*\d+\s*[:：-])\s*/u, "").trim())
    .filter((l) => l && !/^(افترضت|لو مش ده)/.test(l))
    .slice(0, 12)
    .map((l) => l.slice(0, 140));
}

function pickMime() {
  const list = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1,mp4a",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return list.find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } }) || "";
}

const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

function hexA(h, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || "");
  if (!m) return `rgba(255,255,255,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** يرسم إطار واحد في الوقت t (بالثواني) */
export function renderFrame(ctx, t, o, font) {
  const { w: W, h: H } = SIZES[o.size];
  const N = o.scenes.length;
  if (!N) return;
  const D = o.dur;
  const i = Math.min(N - 1, Math.floor(t / D));
  const local = t - i * D;

  drawScene(ctx, i, local, o, font, 1, W, H);
  // انتقال ناعم للمشهد اللي بعده
  if (i < N - 1 && local > D - FADE) {
    const a = (local - (D - FADE)) / FADE;
    drawScene(ctx, i + 1, local - D, o, font, a, W, H);
  }

  // شرايط التقدم فوق (زي الستوري)
  const unit = Math.min(W, H);
  const pad = unit * 0.05;
  const gap = unit * 0.008;
  const bw = (W - pad * 2 - gap * (N - 1)) / N;
  const bh = Math.max(3, unit * 0.006);
  for (let k = 0; k < N; k++) {
    const x = W - pad - (k + 1) * bw - k * gap; // أول مشهد على اليمين
    const fill = k < i ? 1 : k > i ? 0 : Math.min(1, local / D);
    ctx.fillStyle = hexA(o.theme.text, 0.25);
    ctx.fillRect(x, pad * 0.7, bw, bh);
    ctx.fillStyle = hexA(o.theme.text, 0.95);
    // الشرايط بتتملا من اليمين للشمال عشان العربي
    ctx.fillRect(x + bw * (1 - fill), pad * 0.7, bw * fill, bh);
  }

  if (o.handle?.trim()) {
    ctx.save();
    ctx.font = `500 ${unit * 0.034}px ${font}`;
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    ctx.fillStyle = hexA(o.theme.text, 0.85);
    ctx.fillText(o.handle.trim(), W / 2, H - pad * 1.1);
    ctx.restore();
  }
}

function drawScene(ctx, i, local, o, font, alpha, W, H) {
  const sc = o.scenes[i];
  const D = o.dur;
  const unit = Math.min(W, H);
  const th = o.theme;
  ctx.save();
  ctx.globalAlpha = alpha;

  const img = sc.img || (o.bgImgs.length ? o.bgImgs[i % o.bgImgs.length] : null);
  const p = Math.max(0, Math.min(1, (local + FADE) / (D + FADE)));
  if (img) {
    // حركة كاميرا هادية (Ken Burns): زووم بسيط وتحريك يمين/شمال بالتبادل
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const k = Math.max(W / iw, H / ih) * (1.04 + 0.1 * p);
    const dw = iw * k, dh = ih * k;
    const dir = i % 2 ? 1 : -1;
    const x = (W - dw) / 2 + dir * (dw - W) * 0.35 * (p - 0.5);
    const y = (H - dh) / 2 + (dh - H) * 0.2 * (0.5 - p);
    ctx.drawImage(img, x, y, dw, dh);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const strong = o.mode !== "photos" || sc.text.trim();
    g.addColorStop(0, `rgba(0,0,0,${strong ? 0.35 : 0.15})`);
    g.addColorStop(1, `rgba(0,0,0,${strong ? 0.72 : 0.25})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, th.c1);
    g.addColorStop(1, th.c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // إضاءات بتتحرك ببطء عشان الخلفية تبقى حية
    const tt = i * 1.7 + local * 0.35;
    for (const [cx, cy, r, a] of [
      [0.75 + 0.12 * Math.sin(tt), 0.2 + 0.08 * Math.cos(tt * 1.3), 0.75, 0.3],
      [0.2 + 0.1 * Math.cos(tt * 0.8), 0.85 + 0.06 * Math.sin(tt), 0.65, 0.18],
    ]) {
      const rg = ctx.createRadialGradient(W * cx, H * cy, 0, W * cx, H * cy, Math.max(W, H) * r);
      rg.addColorStop(0, hexA(th.accent, a));
      rg.addColorStop(1, hexA(th.accent, 0));
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }
  }

  const text = sc.text.trim();
  if (text) {
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    const onPhoto = o.mode === "photos";
    const first = i === 0 && !onPhoto;
    const last = i === o.scenes.length - 1 && !onPhoto && o.scenes.length > 2;
    const size = unit * (onPhoto ? 0.052 : first ? 0.085 : 0.066);
    ctx.font = `${first ? 600 : 500} ${size}px ${font}`;
    const lines = wrapLines(ctx, text, W * (onPhoto ? 0.8 : 0.82));
    const lh = size * 1.42;
    const blockH = lines.length * lh;
    let y0 = onPhoto ? H - unit * 0.14 - blockH : (H - blockH) / 2;

    if (onPhoto) {
      // كلام على الصورة: خلفية شفافة تحته عشان يتقري
      ctx.font = `500 ${size}px ${font}`;
      const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const bx = (W - maxW) / 2 - size * 0.7, by = y0 - size * 0.55;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      roundRect(ctx, bx, by, maxW + size * 1.4, blockH + size * 0.6, size * 0.5);
      ctx.fill();
    }

    if (first || last) {
      // خط صغير بلون مميز فوق العنوان وتحت آخر مشهد
      const lw = unit * 0.12, lhh = Math.max(3, unit * 0.007);
      ctx.fillStyle = th.accent;
      const ly = first ? y0 - lh * 0.55 : y0 + blockH + lh * 0.1;
      ctx.fillRect(W / 2 - lw / 2, ly, lw * ease(local / 0.6), lhh);
    }

    lines.forEach((line, j) => {
      const start = 0.12 + j * 0.16;
      const a = ease((local - start) / 0.45);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha * a;
      ctx.fillStyle = last ? th.accent : th.text;
      if (img && !onPhoto) { ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = size * 0.25; }
      ctx.fillText(line, W / 2, y0 + (j + 1) * lh - lh * 0.28 + (1 - a) * size * 0.6);
      ctx.restore();
    });
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
