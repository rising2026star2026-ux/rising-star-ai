"use client";
// إزالة الخلفية السادة: بتدوس على لون الخلفية، والأداة بتشيله من الأطراف لجوه.
// بتشتغل أحسن مع صور المنتجات واللوجوهات والصور اللي خلفيتها لون واحد.
import { useEffect, useRef, useState } from "react";
import { Drop, Range, Seg, ColorField, Workbench, Note, Busy, styles as s } from "./ui";
import { IMAGE_TYPES, loadImage, makeCanvas, canvasToBlob, download, baseName, fitWithin, checker, hex, hexToRgb } from "./util";
import { toast } from "@/lib/store";

const WORK_MAX = 2400; // أطول ضلع للشغل، عشان الأداة تفضل سريعة على الموبايل

export default function RemoveBg() {
  const [img, setImg] = useState(null);
  const [name, setName] = useState("image");
  const [key, setKey] = useState(null); // لون الخلفية
  const [tol, setTol] = useState(18);
  const [soft, setSoft] = useState(8);
  const [mode, setMode] = useState("edges");
  const [fill, setFill] = useState("none");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const view = useRef(null);
  const src = useRef(null); // بيانات الصورة الأصلية بمقاس الشغل
  const result = useRef(null);

  async function open(files) {
    setError("");
    try {
      const im = await loadImage(files[0]);
      const { w, h } = fitWithin(im.naturalWidth, im.naturalHeight, WORK_MAX);
      const c = makeCanvas(w, h);
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(im, 0, 0, w, h);
      src.current = ctx.getImageData(0, 0, w, h);
      setKey(guessBackground(src.current));
      setName(baseName(files[0].name));
      setImg(im);
    } catch (e) { setError(e.message); }
  }

  // إعادة الحساب مع أي تغيير (بتأخير بسيط عشان السلايدر يفضل ناعم)
  useEffect(() => {
    if (!img || !key || !src.current) return;
    const t = setTimeout(() => {
      const out = removeBackground(src.current, key, tol, soft, mode);
      result.current = out;
      paint();
    }, 60);
    return () => clearTimeout(t);
  }, [img, key, tol, soft, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { paint(); }, [fill, fillColor]); // eslint-disable-line react-hooks/exhaustive-deps

  function paint() {
    const c = view.current, out = result.current;
    if (!c || !out) return;
    c.width = out.width;
    c.height = out.height;
    const ctx = c.getContext("2d");
    if (fill === "none") checker(ctx, c.width, c.height, Math.max(10, Math.round(c.width / 60)));
    else { ctx.fillStyle = fill === "white" ? "#ffffff" : fillColor; ctx.fillRect(0, 0, c.width, c.height); }
    const tmp = makeCanvas(out.width, out.height);
    tmp.getContext("2d").putImageData(out, 0, 0);
    ctx.drawImage(tmp, 0, 0);
  }

  // دوسة على الصورة = اختيار لون الخلفية
  function pick(e) {
    const c = view.current;
    if (!c || !src.current) return;
    const r = c.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * src.current.width);
    const y = Math.floor(((e.clientY - r.top) / r.height) * src.current.height);
    const i = (y * src.current.width + x) * 4;
    const d = src.current.data;
    setKey({ r: d[i], g: d[i + 1], b: d[i + 2] });
  }

  async function save() {
    setBusy(true);
    try {
      const out = result.current;
      const c = makeCanvas(out.width, out.height);
      const ctx = c.getContext("2d");
      if (fill !== "none") { ctx.fillStyle = fill === "white" ? "#ffffff" : fillColor; ctx.fillRect(0, 0, c.width, c.height); }
      const tmp = makeCanvas(out.width, out.height);
      tmp.getContext("2d").putImageData(out, 0, 0);
      ctx.drawImage(tmp, 0, 0);
      const fmt = fill === "none" ? "png" : "jpg";
      const blob = await canvasToBlob(c, fmt, 0.92);
      download(blob, `${name}-no-bg.${fmt}`);
      toast("اتحملت");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (!img) {
    return (
      <div className={s.root}>
        <span className={s.badge}><i />بيشتغل على جهازك، وصورك ما بتترفعش</span>
        <Drop accept={IMAGE_TYPES} onFiles={open} hint="أحسن نتيجة مع صورة خلفيتها لون واحد: منتج على خلفية بيضا، لوجو، أو صورة استوديو." />
        {error && <Note tone="warn">{error}</Note>}
      </div>
    );
  }

  const keyHex = key ? hex(key.r, key.g, key.b) : "#ffffff";

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <span className={s.badge}><i />دوس على الخلفية في الصورة عشان تختار لونها</span>
        <span className={s.spacer} />
        <button type="button" className="btn ghost" onClick={() => setImg(null)}>صورة تانية</button>
      </div>
      <Workbench
        preview={<canvas ref={view} className={s.clickable} onClick={pick} aria-label="معاينة: دوس على الخلفية لاختيار لونها" />}
        controls={
          <>
            <ColorField label="لون الخلفية اللي هيتشال" value={keyHex} onChange={(v) => setKey(hexToRgb(v))} />
            <Range label="قوة الإزالة" value={tol} min={2} max={60} onChange={setTol} />
            <Range label="نعومة الأطراف" value={soft} min={0} max={30} onChange={setSoft} />
            <Seg
              label="طريقة الإزالة"
              value={mode}
              options={[["edges", "من الأطراف بس"], ["all", "اللون ده في كل حتة"]]}
              onChange={setMode}
            />
            <Note>«من الأطراف بس» بتحافظ على الألوان اللي شبه الخلفية جوه المنتج نفسه. لو فيه خلفية محبوسة بين أجزاء (زي جوه حرف O)، استخدم «كل حتة».</Note>
            <Seg label="الخلفية الجديدة" value={fill} options={[["none", "شفافة"], ["white", "بيضا"], ["color", "لون"]]} onChange={setFill} />
            {fill === "color" && <ColorField label="اللون" value={fillColor} onChange={setFillColor} />}
          </>
        }
        footer={
          <>
            {busy ? <Busy /> : <button type="button" className="btn" onClick={save}>تحميل {fill === "none" ? "PNG شفافة" : "الصورة"}</button>}
            <Note>
              لصور الأشخاص أو الخلفيات المزحومة، الأدق تستخدم أداة متخصصة بالذكاء الاصطناعي زي{" "}
              <a href="https://www.remove.bg" target="_blank" rel="noopener noreferrer">remove.bg</a>.
            </Note>
            {error && <Note tone="warn">{error}</Note>}
          </>
        }
      />
    </div>
  );
}

/** لون الخلفية الأرجح: أكتر لون متكرر في أطراف الصورة */
function guessBackground({ data, width, height }) {
  const counts = new Map();
  const add = (x, y) => {
    const i = (y * width + x) * 4;
    const k = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const c = counts.get(k) || { n: 0, r: 0, g: 0, b: 0 };
    c.n++; c.r += data[i]; c.g += data[i + 1]; c.b += data[i + 2];
    counts.set(k, c);
  };
  const step = Math.max(1, Math.floor(Math.max(width, height) / 400));
  for (let x = 0; x < width; x += step) { add(x, 0); add(x, height - 1); }
  for (let y = 0; y < height; y += step) { add(0, y); add(width - 1, y); }
  let best = null;
  for (const c of counts.values()) if (!best || c.n > best.n) best = c;
  return best ? { r: best.r / best.n, g: best.g / best.n, b: best.b / best.n } : { r: 255, g: 255, b: 255 };
}

/** المسافة بين لونين (مقياس تقريبي قريب من إحساس العين) */
function dist(d, i, k) {
  const dr = d[i] - k.r, dg = d[i + 1] - k.g, db = d[i + 2] - k.b;
  return Math.sqrt(0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db);
}

export function removeBackground(srcData, key, tol, soft, mode) {
  const { width: W, height: H } = srcData;
  const d = new Uint8ClampedArray(srcData.data); // نسخة، عشان الأصل يفضل زي ما هو
  const T = tol * 2.2;
  const S = Math.max(0.001, soft * 2.2);
  const N = W * H;

  // removed: 1 = اتشال كله، 2 = حافة متدرجة
  const removed = new Uint8Array(N);

  if (mode === "all") {
    for (let p = 0; p < N; p++) {
      const dd = dist(d, p * 4, key);
      if (dd <= T) removed[p] = 1;
      else if (soft && dd <= T + S) removed[p] = 2;
    }
  } else {
    // ملء من كل الأطراف لجوه، طالما اللون قريب من لون الخلفية
    const q = new Int32Array(N);
    let head = 0, tail = 0;
    const seed = (p) => {
      if (!removed[p] && dist(d, p * 4, key) <= T) { removed[p] = 1; q[tail++] = p; }
    };
    for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
    while (head < tail) {
      const p = q[head++];
      const x = p % W, y = (p / W) | 0;
      if (x > 0) seed(p - 1);
      if (x < W - 1) seed(p + 1);
      if (y > 0) seed(p - W);
      if (y < H - 1) seed(p + W);
    }
    // الحافة: البكسلات اللي جنب المشال ولونها قريب شوية
    if (soft) {
      for (let p = 0; p < N; p++) {
        if (removed[p]) continue;
        const x = p % W, y = (p / W) | 0;
        const near = (x > 0 && removed[p - 1] === 1) || (x < W - 1 && removed[p + 1] === 1) || (y > 0 && removed[p - W] === 1) || (y < H - 1 && removed[p + W] === 1);
        if (near && dist(d, p * 4, key) <= T + S) removed[p] = 2;
      }
    }
  }

  for (let p = 0; p < N; p++) {
    const i = p * 4;
    if (removed[p] === 1) d[i + 3] = 0;
    else if (removed[p] === 2) {
      const a = Math.min(1, (dist(d, i, key) - T) / S);
      d[i + 3] = Math.round(d[i + 3] * Math.max(0, a));
    }
  }
  return new ImageData(d, W, H);
}
