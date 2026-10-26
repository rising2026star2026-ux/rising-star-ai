"use client";
// محرر الصور: بديل خفيف لفوتوشوب. إضاءة وألوان وفلاتر وقص وتدوير، وكله على جهاز المستخدم.
import { useEffect, useRef, useState } from "react";
import { Drop, Range, Seg, Workbench, Note, Busy, styles as s } from "./ui";
import { IMAGE_TYPES, loadImage, makeCanvas, canvasToBlob, download, baseName, formatBytes } from "./util";
import { NEUTRAL, applyAdjust, canBlur, isNeutral } from "./pixels";
import { toast } from "@/lib/store";

const PRESETS = [
  ["طبيعي", {}],
  ["حيوي", { saturate: 140, contrast: 110 }],
  ["دافئ", { warmth: 22, saturate: 108, brightness: 103 }],
  ["بارد", { warmth: -22, contrast: 104 }],
  ["أبيض وأسود", { grayscale: 100, contrast: 118 }],
  ["قديم", { sepia: 65, contrast: 92, brightness: 104, saturate: 85 }],
  ["درامي", { contrast: 142, saturate: 78, brightness: 94 }],
  ["ناعم", { contrast: 86, brightness: 108, saturate: 92 }],
  ["سينما", { contrast: 118, saturate: 82, warmth: 10, hue: -6 }],
];

const RATIOS = [
  ["free", "الأصلي"],
  [1, "1:1"],
  [4 / 5, "4:5"],
  [9 / 16, "9:16"],
  [16 / 9, "16:9"],
  [3 / 2, "3:2"],
];

const SLIDERS = [
  ["brightness", "الإضاءة", 40, 180, "%"],
  ["contrast", "التباين", 40, 180, "%"],
  ["saturate", "تشبّع الألوان", 0, 220, "%"],
  ["warmth", "الدفء", -50, 50, ""],
  ["hue", "درجة اللون", -180, 180, "°"],
  ["grayscale", "أبيض وأسود", 0, 100, "%"],
  ["sepia", "لون قديم", 0, 100, "%"],
  ["blur", "تنعيم", 0, 12, "px"],
];

const SIZES = [[0, "الأصلي"], [2048, "2048"], [1080, "1080"]];

export default function PhotoEditor() {
  const [img, setImg] = useState(null);
  const [name, setName] = useState("photo");
  const [f, setF] = useState(NEUTRAL);
  const [preset, setPreset] = useState("طبيعي");
  const [rot, setRot] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [ratio, setRatio] = useState("free");
  const [offX, setOffX] = useState(50);
  const [offY, setOffY] = useState(50);
  const [format, setFormat] = useState("jpg");
  const [size, setSize] = useState(0);
  const [peek, setPeek] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const view = useRef(null);
  const frame = useRef(0);

  async function open(files) {
    setError("");
    try {
      const im = await loadImage(files[0]);
      setImg(im);
      setName(baseName(files[0].name));
      setFormat(files[0].type === "image/png" ? "png" : "jpg");
    } catch (e) { setError(e.message); }
  }

  // رسم المعاينة (بمقاس أصغر عشان تبقى سريعة)
  useEffect(() => {
    if (!img || !view.current) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const out = render(img, { f: peek ? NEUTRAL : f, rot, flipH, flipV, ratio, offX, offY }, 1000);
      const c = view.current;
      if (!c) return;
      c.width = out.width;
      c.height = out.height;
      c.getContext("2d").drawImage(out, 0, 0);
    });
  }, [img, f, rot, flipH, flipV, ratio, offX, offY, peek]);

  function setOne(k, v) { setF((x) => ({ ...x, [k]: v })); setPreset(""); }
  function applyPreset(label, p) { setF({ ...NEUTRAL, ...p, blur: f.blur }); setPreset(label); }
  function reset() { setF(NEUTRAL); setPreset("طبيعي"); setRot(0); setFlipH(false); setFlipV(false); setRatio("free"); setOffX(50); setOffY(50); }

  async function save() {
    setBusy(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 30)); // يسيب الواجهة تحدّث نفسها الأول
      const out = render(img, { f, rot, flipH, flipV, ratio, offX, offY }, size || 6000);
      const blob = await canvasToBlob(out, format, 0.92);
      download(blob, `${name}-rising-star.${format}`);
      toast(`اتحملت (${formatBytes(blob.size)})`);
    } catch (e) {
      setError(e.message || "حصلت مشكلة في الحفظ.");
    } finally { setBusy(false); }
  }

  if (!img) {
    return (
      <div className={s.root}>
        <span className={s.badge}><i />بيشتغل على جهازك، وصورك ما بتترفعش</span>
        <Drop accept={IMAGE_TYPES} onFiles={open} title="اسحب صورة هنا، أو اضغط تختار، أو الصقها (Ctrl+V)" />
        {error && <Note tone="warn">{error}</Note>}
      </div>
    );
  }

  const cropOn = ratio !== "free";

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <span className={s.badge}><i />{img.naturalWidth} × {img.naturalHeight}</span>
        <span className={s.spacer} />
        <button
          type="button"
          className="btn ghost"
          onPointerDown={() => setPeek(true)}
          onPointerUp={() => setPeek(false)}
          onPointerLeave={() => setPeek(false)}
          onKeyDown={(e) => { if (e.key === " ") setPeek(true); }}
          onKeyUp={() => setPeek(false)}
          disabled={isNeutral(f)}
        >
          اضغط مطوّل: قبل التعديل
        </button>
        <button type="button" className="btn ghost" onClick={reset}>من الأول</button>
        <button type="button" className="btn ghost" onClick={() => setImg(null)}>صورة تانية</button>
      </div>

      <Workbench
        preview={<canvas ref={view} aria-label="معاينة الصورة" />}
        controls={
          <>
            <div className={s.section}>
              <span className={s.sectionTitle}>فلاتر جاهزة</span>
              <div className={s.presets}>
                {PRESETS.map(([label, p]) => (
                  <button key={label} type="button" className={`${s.preset} ${preset === label ? s.presetOn : ""}`} onClick={() => applyPreset(label, p)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className={s.section}>
              <span className={s.sectionTitle}>تعديل يدوي</span>
              {SLIDERS.map(([k, label, min, max, unit]) =>
                k === "blur" && !blurOk() ? null : (
                  <Range key={k} label={label} value={f[k]} min={min} max={max} unit={unit} onChange={(v) => setOne(k, v)} />
                )
              )}
            </div>

            <div className={s.section}>
              <span className={s.sectionTitle}>تدوير وقلب</span>
              <div className={s.iconRow}>
                <button type="button" className={s.iconBtn} onClick={() => setRot((r) => (r + 270) % 360)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 12a8 8 0 108-8H8" /><path d="M10 1L7 4l3 3" /></svg>
                  يسار
                </button>
                <button type="button" className={s.iconBtn} onClick={() => setRot((r) => (r + 90) % 360)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M20 12a8 8 0 11-8-8h4" /><path d="M14 1l3 3-3 3" /></svg>
                  يمين
                </button>
                <button type="button" className={s.iconBtn} onClick={() => setFlipH((v) => !v)} aria-pressed={flipH}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 3v18M8 7L3 12l5 5V7zM16 7l5 5-5 5V7z" /></svg>
                  مرآة
                </button>
                <button type="button" className={s.iconBtn} onClick={() => setFlipV((v) => !v)} aria-pressed={flipV}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 12h18M7 8L12 3l5 5H7zM7 16l5 5 5-5H7z" /></svg>
                  مقلوب
                </button>
              </div>
            </div>

            <div className={s.section}>
              <span className={s.sectionTitle}>قص</span>
              <div className={s.presets}>
                {RATIOS.map(([v, label]) => (
                  <button key={label} type="button" className={`${s.preset} ${ratio === v ? s.presetOn : ""}`} onClick={() => setRatio(v)}>
                    {label}
                  </button>
                ))}
              </div>
              {cropOn && (
                <>
                  <Range label="تحريك القص أفقي" value={offX} min={0} max={100} unit="%" onChange={setOffX} />
                  <Range label="تحريك القص رأسي" value={offY} min={0} max={100} unit="%" onChange={setOffY} />
                </>
              )}
            </div>
          </>
        }
        footer={
          <>
            <Seg label="الصيغة" value={format} options={[["jpg", "JPG"], ["png", "PNG"], ["webp", "WebP"]]} onChange={setFormat} />
            <Seg label="أطول ضلع" value={size} options={SIZES} onChange={setSize} />
            {busy ? <Busy text="بيجهز الصورة..." /> : <button type="button" className="btn" onClick={save}>تحميل الصورة</button>}
            {error && <Note tone="warn">{error}</Note>}
          </>
        }
      />
    </div>
  );
}

let blurSupport = null;
function blurOk() {
  if (blurSupport === null) {
    try { blurSupport = canBlur(document.createElement("canvas").getContext("2d")); } catch { blurSupport = false; }
  }
  return blurSupport;
}

/** القص بالنسبة المطلوبة، مع تحريك مكان القص */
function cropRect(w, h, ratio, offX, offY, rotated) {
  if (ratio === "free") return { sx: 0, sy: 0, sw: w, sh: h };
  const r = rotated ? 1 / ratio : ratio; // لو الصورة متلفة، النسبة بتتعكس على الأصل
  let sw = w, sh = w / r;
  if (sh > h) { sh = h; sw = h * r; }
  return { sx: (w - sw) * (offX / 100), sy: (h - sh) * (offY / 100), sw, sh };
}

/** يرسم الصورة بكل التعديلات. max = أطول ضلع للنتيجة */
export function render(img, { f, rot, flipH, flipV, ratio, offX, offY }, max) {
  const rotated = rot === 90 || rot === 270;
  const { sx, sy, sw, sh } = cropRect(img.naturalWidth, img.naturalHeight, ratio, offX, offY, rotated);
  const outW0 = rotated ? sh : sw;
  const outH0 = rotated ? sw : sh;
  const k = Math.min(1, max / Math.max(outW0, outH0));
  const W = Math.round(outW0 * k), H = Math.round(outH0 * k);
  const dw = sw * k, dh = sh * k;

  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingQuality = "high";
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  if (f.blur && blurOk()) ctx.filter = `blur(${(f.blur * Math.max(W, H)) / 1000}px)`;
  ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
  ctx.filter = "none";

  if (!isNeutral({ ...f, blur: 0 })) {
    const data = ctx.getImageData(0, 0, W, H);
    ctx.putImageData(applyAdjust(data, f), 0, 0);
  }
  return c;
}
