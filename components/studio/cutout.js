"use client";
// إزالة الخلفية بالذكاء الاصطناعي على جهاز الزائر (Transformers.js + BiRefNet lite، رخصة MIT).
// الموديل بيتحمّل مرة واحدة للصفحة، وبعدها بيفضل في كاش المتصفح. بيستخدمه «إزالة الخلفية» و«صوّرها بموبايلك» و«كتالوجك في دقيقة».
const TJS = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.1";
const MODEL = "onnx-community/BiRefNet_lite-ONNX";

let loader = null;
export function getSegmenter(onProgress) {
  if (!loader) {
    loader = (async () => {
      const T = await import(/* webpackIgnore: true */ TJS);
      T.env.allowLocalModels = false;
      const tries = [];
      if (typeof navigator !== "undefined" && navigator.gpu) tries.push({ device: "webgpu", dtype: "fp16" }, { device: "webgpu", dtype: "fp32" });
      tries.push({ device: "wasm", dtype: "q8" }, { device: "wasm", dtype: "fp32" });
      let last;
      for (const o of tries) {
        try {
          const seg = await T.pipeline("image-segmentation", MODEL, { ...o, progress_callback: onProgress });
          return { T, seg };
        } catch (e) { last = e; }
      }
      throw last;
    })().catch((e) => { loader = null; throw e; });
  }
  return loader;
}

/** متابعة نسبة تحميل الموديل (كذا ملف) كرقم واحد من 0 لـ 100 */
export function progressTracker(set) {
  const files = new Map();
  return (p) => {
    if (p.status === "progress" && p.total) {
      files.set(p.file, [p.loaded, p.total]);
      let a = 0, b = 0;
      for (const [l, t] of files.values()) { a += l; b += t; }
      set(Math.round((a / b) * 100));
    }
  };
}

function blobOf(canvas) {
  return new Promise((r, j) => canvas.toBlob((b) => (b ? r(b) : j(new Error("canvas"))), "image/png"));
}

/** بيرجّع كانفاس بنفس مقاس الصورة والخلفية شفافة */
export async function cutoutCanvas(src, onProgress, onReady) {
  const { T, seg } = await getSegmenter(onProgress);
  onReady?.();
  const w = src.width, h = src.height;
  const base = document.createElement("canvas");
  base.width = w; base.height = h;
  base.getContext("2d").drawImage(src, 0, 0);
  const raw = await T.RawImage.fromBlob(await blobOf(base));
  const out = await seg(raw);
  const mask = (Array.isArray(out) ? out[0] : out)?.mask;
  if (!mask) throw new Error("الموديل ما رجّعش نتيجة.");
  const mc = document.createElement("canvas");
  mc.width = w; mc.height = h;
  const mctx = mc.getContext("2d", { willReadFrequently: true });
  mctx.drawImage(mask.toCanvas(), 0, 0, w, h);
  const m = mctx.getImageData(0, 0, w, h).data;
  const bctx = base.getContext("2d", { willReadFrequently: true });
  const px = bctx.getImageData(0, 0, w, h);
  for (let i = 0; i < px.data.length; i += 4) px.data[i + 3] = m[i];
  bctx.putImageData(px, 0, 0);
  return base;
}

/** بيقص الفراغ الشفاف حوالين المنتج (عشان يتحط في نص المشهد بالظبط). بيرجّع null لو الصورة كلها شفافة */
export function trimAlpha(canvas, threshold = 18) {
  const { width: w, height: h } = canvas;
  const d = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > threshold) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  // لو المنتج مساحته صغيرة جداً من الصورة، غالباً القص فشل
  if (cw * ch < w * h * 0.02) return null;
  const c = document.createElement("canvas");
  c.width = cw; c.height = ch;
  c.getContext("2d").drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
  return c;
}
