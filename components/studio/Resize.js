"use client";
// تغيير مقاس الصور بمقاسات السوشيال ميديا الجاهزة أو مقاس حر
import { useEffect, useMemo, useRef, useState } from "react";
import { Drop, Seg, ColorField, Workbench, Note, Busy, styles as s } from "./ui";
import { IMAGE_TYPES, loadImage, makeCanvas, canvasToBlob, download, baseName, formatBytes, clamp } from "./util";
import { toast } from "@/lib/store";

export const SIZE_PRESETS = [
  { id: "ig-post", label: "بوست إنستجرام", w: 1080, h: 1080 },
  { id: "ig-portrait", label: "بوست طولي", w: 1080, h: 1350 },
  { id: "story", label: "ستوري وريلز", w: 1080, h: 1920 },
  { id: "fb-post", label: "بوست فيسبوك", w: 1200, h: 630 },
  { id: "fb-cover", label: "غلاف فيسبوك", w: 851, h: 315 },
  { id: "yt-thumb", label: "صورة يوتيوب", w: 1280, h: 720 },
  { id: "x-post", label: "بوست إكس", w: 1600, h: 900 },
  { id: "linkedin", label: "لينكدإن", w: 1200, h: 627 },
  { id: "avatar", label: "صورة بروفايل", w: 500, h: 500 },
  { id: "custom", label: "مقاس حر", w: 0, h: 0 },
];

export default function Resize() {
  const [img, setImg] = useState(null);
  const [file, setFile] = useState(null);
  const [preset, setPreset] = useState("ig-post");
  const [cw, setCw] = useState(1080);
  const [ch, setCh] = useState(1080);
  const [lock, setLock] = useState(true);
  const [fit, setFit] = useState("cover");
  const [bg, setBg] = useState("#ffffff");
  const [format, setFormat] = useState("jpg");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const view = useRef(null);

  async function open(files) {
    setError("");
    try {
      const im = await loadImage(files[0]);
      setImg(im);
      setFile(files[0]);
      setCw(im.naturalWidth);
      setCh(im.naturalHeight);
      setFormat(files[0].type === "image/png" ? "png" : "jpg");
    } catch (e) { setError(e.message); }
  }

  const target = useMemo(() => {
    const p = SIZE_PRESETS.find((x) => x.id === preset);
    if (p && p.id !== "custom") return { w: p.w, h: p.h };
    return { w: clamp(Math.round(cw) || 1, 1, 8000), h: clamp(Math.round(ch) || 1, 1, 8000) };
  }, [preset, cw, ch]);

  useEffect(() => {
    if (!img || !view.current) return;
    const out = draw(img, target.w, target.h, preset === "custom" ? "stretch" : fit, bg, 900);
    const c = view.current;
    c.width = out.width;
    c.height = out.height;
    c.getContext("2d").drawImage(out, 0, 0);
  }, [img, target, fit, bg, preset]);

  function setW(v) {
    setCw(v);
    if (lock && img) setCh(Math.round((v * img.naturalHeight) / img.naturalWidth));
  }
  function setH(v) {
    setCh(v);
    if (lock && img) setCw(Math.round((v * img.naturalWidth) / img.naturalHeight));
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const out = draw(img, target.w, target.h, preset === "custom" ? "stretch" : fit, bg);
      const blob = await canvasToBlob(out, format, 0.9);
      download(blob, `${baseName(file.name)}-${target.w}x${target.h}.${format}`);
      toast(`اتحملت (${formatBytes(blob.size)})`);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (!img) {
    return (
      <div className={s.root}>
        <span className={s.badge}><i />بيشتغل على جهازك، وصورك ما بتترفعش</span>
        <Drop accept={IMAGE_TYPES} onFiles={open} />
        {error && <Note tone="warn">{error}</Note>}
      </div>
    );
  }

  const custom = preset === "custom";

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <span className={s.badge}><i />الأصلي {img.naturalWidth} × {img.naturalHeight}</span>
        <span className={s.badge}>الجديد <bdi dir="ltr">{target.w} × {target.h}</bdi></span>
        <span className={s.spacer} />
        <button type="button" className="btn ghost" onClick={() => setImg(null)}>صورة تانية</button>
      </div>
      <Workbench
        preview={<canvas ref={view} aria-label="معاينة المقاس الجديد" />}
        controls={
          <>
            <div className={s.section}>
              <span className={s.sectionTitle}>المقاس</span>
              <div className={s.presets}>
                {SIZE_PRESETS.map((p) => (
                  <button key={p.id} type="button" className={`${s.preset} ${preset === p.id ? s.presetOn : ""}`} onClick={() => setPreset(p.id)}>
                    {p.label}
                    {p.w > 0 && <small>{p.w}×{p.h}</small>}
                  </button>
                ))}
              </div>
            </div>
            {custom ? (
              <div className={s.section}>
                <div className={s.row2}>
                  <NumberField label="العرض" value={cw} onChange={setW} />
                  <NumberField label="الطول" value={ch} onChange={setH} />
                </div>
                <label className={s.colorField}>
                  <span>حافظ على النسبة</span>
                  <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} />
                </label>
                <div className={s.presets}>
                  {[25, 50, 75, 150, 200].map((p) => (
                    <button key={p} type="button" className={s.preset} onClick={() => { setLock(true); setCw(Math.round((img.naturalWidth * p) / 100)); setCh(Math.round((img.naturalHeight * p) / 100)); }}>
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={s.section}>
                <Seg label="لو النسبة مختلفة" value={fit} options={[["cover", "قص لملء المقاس"], ["contain", "الصورة كاملة بخلفية"]]} onChange={setFit} />
                {fit === "contain" && <ColorField label="لون الخلفية" value={bg} onChange={setBg} />}
              </div>
            )}
          </>
        }
        footer={
          <>
            <Seg label="الصيغة" value={format} options={[["jpg", "JPG"], ["png", "PNG"], ["webp", "WebP"]]} onChange={setFormat} />
            {busy ? <Busy /> : <button type="button" className="btn" onClick={save}>تحميل الصورة</button>}
            {error && <Note tone="warn">{error}</Note>}
          </>
        }
      />
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className={s.field}>
      <span className={s.fieldLabel}>{label}</span>
      <input className={s.input} type="number" min={1} max={8000} inputMode="numeric" dir="ltr" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

/** يرسم الصورة في المقاس الجديد. max اختياري للمعاينة بس */
export function draw(img, W, H, fit, bg, max) {
  const k = max ? Math.min(1, max / Math.max(W, H)) : 1;
  const c = makeCanvas(W * k, H * k);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const iw = img.naturalWidth, ih = img.naturalHeight;
  if (fit === "stretch") {
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  const scale = fit === "cover" ? Math.max(c.width / iw, c.height / ih) : Math.min(c.width / iw, c.height / ih);
  const dw = iw * scale, dh = ih * scale;
  if (fit === "contain") {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  ctx.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
  return c;
}
