"use client";
// العلامة المائية: اسمك أو لوجوك على صورة أو كذا صورة مرة واحدة
import { useEffect, useRef, useState } from "react";
import { Drop, Range, Seg, ColorField, TextField, Workbench, Note, Busy, styles as s } from "./ui";
import { IMAGE_TYPES, loadImage, makeCanvas, canvasToBlob, download, downloadAll, baseName, siteFont, ensureFont } from "./util";
import { toast } from "@/lib/store";

const SPOTS = [
  ["br", "تحت يمين"], ["bl", "تحت شمال"], ["c", "في النص"], ["tr", "فوق يمين"], ["tl", "فوق شمال"], ["tile", "متكرر"],
];

export default function Watermark() {
  const [files, setFiles] = useState([]);
  const [first, setFirst] = useState(null);
  const [kind, setKind] = useState("text");
  const [text, setText] = useState("© Rising StarAi");
  const [logo, setLogo] = useState(null);
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(60);
  const [size, setSize] = useState(5);
  const [spot, setSpot] = useState("br");
  const [busy, setBusy] = useState(false);
  const view = useRef(null);

  useEffect(() => { ensureFont(600); }, []);

  async function open(list) {
    const next = [...files, ...list].slice(0, 20);
    setFiles(next);
    if (!first) { try { setFirst(await loadImage(next[0])); } catch (e) { toast(e.message); } }
  }

  const opts = { kind, text, logo, color, opacity, size, spot };

  useEffect(() => {
    if (!first || !view.current) return;
    const out = stamp(first, opts, 1000);
    const c = view.current;
    c.width = out.width; c.height = out.height;
    c.getContext("2d").drawImage(out, 0, 0);
  });

  async function save() {
    setBusy(true);
    try {
      const out = [];
      for (const f of files) {
        const img = await loadImage(f);
        const c = stamp(img, opts);
        const fmt = f.type === "image/png" ? "png" : "jpg";
        out.push({ blob: await canvasToBlob(c, fmt, 0.92), name: `${baseName(f.name)}-wm.${fmt}` });
      }
      if (out.length === 1) download(out[0].blob, out[0].name);
      else await downloadAll(out);
      toast(out.length > 1 ? `اتحملت ${out.length} صور` : "اتحملت");
    } catch (e) { toast(e.message); } finally { setBusy(false); }
  }

  if (!first) {
    return (
      <div className={s.root}>
        <span className={s.badge}><i />بيشتغل على جهازك، وصورك ما بتترفعش</span>
        <Drop accept={IMAGE_TYPES} multiple onFiles={open} hint="ممكن تختار لحد 20 صورة، والعلامة هتتحط على كلهم بنفس الشكل." />
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <span className={s.badge}><i />{files.length} {files.length === 1 ? "صورة" : "صور"}</span>
        <span className={s.spacer} />
        <button type="button" className="btn ghost" onClick={() => { setFiles([]); setFirst(null); }}>ابدأ من الأول</button>
      </div>
      <Workbench
        preview={<canvas ref={view} aria-label="معاينة العلامة المائية على أول صورة" />}
        controls={
          <>
            <Seg label="العلامة" value={kind} options={[["text", "كلام"], ["logo", "لوجو"]]} onChange={setKind} />
            {kind === "text" ? (
              <>
                <TextField label="الكلام" value={text} onChange={setText} maxLength={60} />
                <ColorField label="اللون" value={color} onChange={setColor} />
              </>
            ) : (
              <Drop accept={IMAGE_TYPES} compact onFiles={async (l) => { try { setLogo(await loadImage(l[0])); } catch (e) { toast(e.message); } }} title={logo ? "غيّر اللوجو" : "اختار اللوجو (PNG شفاف أحسن)"} />
            )}
            <Range label="الشفافية" value={opacity} min={10} max={100} unit="%" onChange={setOpacity} />
            <Range label="الحجم" value={size} min={2} max={20} onChange={setSize} />
            <div className={s.field}>
              <span className={s.fieldLabel}>المكان</span>
              <div className={s.presets}>
                {SPOTS.map(([v, label]) => (
                  <button key={v} type="button" className={`${s.preset} ${spot === v ? s.presetOn : ""}`} onClick={() => setSpot(v)}>{label}</button>
                ))}
              </div>
            </div>
            <Drop accept={IMAGE_TYPES} multiple compact onFiles={open} title="زوّد صور تانية" />
          </>
        }
        footer={
          <>
            {busy ? <Busy text="بيجهز الصور..." /> : <button type="button" className="btn" onClick={save} disabled={kind === "logo" && !logo}>تحميل {files.length > 1 ? `الـ${files.length} صور` : "الصورة"}</button>}
            {files.length > 1 && <Note>المتصفح ممكن يسألك مرة توافق على تحميل أكتر من ملف.</Note>}
          </>
        }
      />
    </div>
  );
}

export function stamp(img, o, max) {
  const k = max ? Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)) : 1;
  const W = Math.round(img.naturalWidth * k), H = Math.round(img.naturalHeight * k);
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, W, H);
  const unit = Math.min(W, H);
  const m = unit * 0.04;
  ctx.globalAlpha = o.opacity / 100;

  let mw, mh, paint;
  if (o.kind === "logo" && o.logo) {
    mh = unit * (o.size / 50);
    mw = (o.logo.naturalWidth / o.logo.naturalHeight) * mh;
    paint = (x, y) => ctx.drawImage(o.logo, x, y, mw, mh);
  } else if (o.kind === "text" && o.text.trim()) {
    const fs = unit * (o.size / 100);
    ctx.font = `600 ${fs}px ${siteFont()}`;
    ctx.direction = "rtl";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    mw = ctx.measureText(o.text).width;
    mh = fs * 1.2;
    ctx.fillStyle = o.color;
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = fs * 0.15;
    paint = (x, y) => {
      ctx.save();
      ctx.direction = "ltr"; // المكان محسوب من الشمال، والمتصفح بيرتب الحروف العربي صح جوه السطر
      ctx.fillText(o.text, x, y);
      ctx.restore();
    };
  } else {
    ctx.globalAlpha = 1;
    return c;
  }

  if (o.spot === "tile") {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 6);
    const stepX = mw + unit * 0.12, stepY = mh + unit * 0.12;
    const R = Math.hypot(W, H);
    for (let y = -R; y < R; y += stepY)
      for (let x = -R + ((Math.round(y / stepY) % 2) * stepX) / 2; x < R; x += stepX) paint(x, y);
    ctx.restore();
  } else {
    const pos = {
      br: [W - m - mw, H - m - mh], bl: [m, H - m - mh], tr: [W - m - mw, m], tl: [m, m], c: [(W - mw) / 2, (H - mh) / 2],
    }[o.spot];
    paint(pos[0], pos[1]);
  }
  ctx.globalAlpha = 1;
  return c;
}
