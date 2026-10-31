"use client";
// إزالة الخلفية بالذكاء الاصطناعي (BiRefNet، رخصة MIT) بطريقتين:
//   1) على سيرفر Hugging Face بحصة الزائر نفسه المجانية (زي مولّد الصور): بتشتغل على أي موبايل في 3-5 ثواني
//   2) على جهاز الزائر (Transformers.js): الصورة ما بتطلعش من جهازه، بس محتاج يحمّل الموديل (50-100 ميجا) وجهاز قوي
// «صوّرها بموبايلك» و«الكتالوج» بيبدأوا بالسيرفر، و«إزالة الخلفية» بيبدأ بالجهاز وبيعرض السيرفر كاختيار.
import { callSpace, fileUrl, withTimeout } from "@/lib/hfspace";

const TJS = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.1";
const MODEL = "onnx-community/BiRefNet_lite-ONNX";
// Spaces مفتوحة على Hugging Face بموديل BiRefNet (اتجربت في 2026-10-31): [العنوان، الدالة، اختيار النتيجة]
const SPACES = [
  ["https://not-lain-background-removal.hf.space", "png", (out) => out?.[0]],
  ["https://not-lain-background-removal.hf.space", "image", (out) => (Array.isArray(out?.[0]) ? out[0][0] : out?.[0])],
  ["https://zhengpeng7-birefnet-demo.hf.space", "image", (out) => (Array.isArray(out?.[0]) ? out[0][0] : out?.[0])],
];

let T = null;
let session = null; // { seg, conf }
const bad = new Set(); // طرق تشغيل فشلت على الجهاز ده

async function lib() {
  if (!T) {
    T = await import(/* webpackIgnore: true */ TJS);
    T.env.allowLocalModels = false;
  }
  return T;
}

function configs() {
  const list = [];
  if (typeof navigator !== "undefined" && navigator.gpu) list.push({ device: "webgpu", dtype: "fp16" }, { device: "webgpu", dtype: "fp32" });
  // نسخة q8 مش موجودة في الموديل ده (404)، فمن غير GPU بنستخدم fp16 (محتاج ذاكرة كبيرة، فبيشتغل على الكمبيوتر غالباً)
  list.push({ device: "wasm", dtype: "fp16" });
  return list.filter((c) => !bad.has(`${c.device}-${c.dtype}`));
}

/** بيحمّل الموديل على الجهاز بأول طريقة متاحة */
export async function getSegmenter(onProgress) {
  const L = await lib();
  if (session) return { T: L, seg: session.seg };
  let last;
  for (const conf of configs()) {
    try {
      const seg = await L.pipeline("image-segmentation", MODEL, { ...conf, progress_callback: onProgress });
      session = { seg, conf };
      return { T: L, seg };
    } catch (e) { last = e; bad.add(`${conf.device}-${conf.dtype}`); }
  }
  throw last || new Error("no backend");
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

function blobOf(canvas, type = "image/png", q) {
  return new Promise((r, j) => canvas.toBlob((b) => (b ? r(b) : j(new Error("canvas"))), type, q));
}

function applyMask(src, maskCanvas) {
  const w = src.width, h = src.height;
  const base = document.createElement("canvas");
  base.width = w; base.height = h;
  const bctx = base.getContext("2d", { willReadFrequently: true });
  bctx.drawImage(src, 0, 0);
  const mc = document.createElement("canvas");
  mc.width = w; mc.height = h;
  const mctx = mc.getContext("2d", { willReadFrequently: true });
  mctx.drawImage(maskCanvas, 0, 0, w, h);
  const m = mctx.getImageData(0, 0, w, h).data;
  const px = bctx.getImageData(0, 0, w, h);
  for (let i = 0; i < px.data.length; i += 4) px.data[i + 3] = m[i];
  bctx.putImageData(px, 0, 0);
  return base;
}

/** على الجهاز. لو طريقة اتحمّلت بس فشلت وهي شغالة (الذاكرة مثلاً)، بنجرب اللي بعدها */
export async function cutoutCanvas(src, onProgress, onReady) {
  const L = await lib();
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { seg } = await getSegmenter(onProgress);
    onReady?.();
    try {
      const raw = await L.RawImage.fromBlob(await blobOf(src));
      const out = await seg(raw);
      const mask = (Array.isArray(out) ? out[0] : out)?.mask;
      if (!mask) throw new Error("no mask");
      return applyMask(src, mask.toCanvas());
    } catch (e) {
      last = e;
      if (session) {
        bad.add(`${session.conf.device}-${session.conf.dtype}`);
        try { await session.seg.dispose?.(); } catch {}
        session = null;
      }
      if (!configs().length) break;
    }
  }
  throw last || new Error("on-device failed");
}

/** على سيرفر Hugging Face: بيرجّع كانفاس بنفس مقاس الصورة والخلفية شفافة */
export async function cutoutCloud(src, { signal } = {}) {
  const small = document.createElement("canvas");
  const k = Math.min(1, 1280 / Math.max(src.width, src.height));
  small.width = Math.round(src.width * k); small.height = Math.round(src.height * k);
  small.getContext("2d").drawImage(src, 0, 0, small.width, small.height);
  const photo = await blobOf(small, "image/jpeg", 0.92);
  let last;
  for (const [host, api, pick] of SPACES) {
    const t = withTimeout(40_000, signal);
    try {
      let base = `${host}/gradio_api`;
      const fd = new FormData();
      fd.append("files", photo, "photo.jpg");
      let up = await fetch(`${base}/upload`, { method: "POST", body: fd, signal: t.signal });
      if (up.status === 404) {
        base = host;
        const fd2 = new FormData();
        fd2.append("files", photo, "photo.jpg");
        up = await fetch(`${base}/upload`, { method: "POST", body: fd2, signal: t.signal });
      }
      if (!up.ok) throw new Error(`upload ${up.status}`);
      const [p] = await up.json();
      const { out, base: b2 } = await callSpace(host, api, [{ path: p, meta: { _type: "gradio.FileData" } }], { signal: t.signal });
      const url = fileUrl(pick(out), b2);
      if (!url) throw new Error("no output");
      const r = await fetch(url, { signal: t.signal });
      if (!r.ok) throw new Error(`file ${r.status}`);
      const blob = await r.blob();
      const bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("decode")); im.src = URL.createObjectURL(blob); });
      const c = document.createElement("canvas");
      c.width = src.width; c.height = src.height;
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      URL.revokeObjectURL(bmp.src);
      if (!hasTransparency(c)) throw new Error("no transparency");
      return c;
    } catch (e) {
      if (signal?.aborted) throw e;
      last = e;
      // الحصة المجانية للزائر خلصت: كل الـ Spaces بتستخدم نفس الحصة، فمفيش داعي نستنى الباقي
      if (e?.quota) break;
    } finally {
      t.done();
    }
  }
  throw last || new Error("cloud failed");
}

function hasTransparency(c) {
  const d = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
  let clear = 0, n = 0;
  for (let i = 3; i < d.length; i += 64) { n++; if (d[i] < 20) clear++; }
  return clear > n * 0.03;
}

/**
 * إزالة الخلفية لأدوات البيّاع: السيرفر الأول (سريع على أي موبايل)، وبعدها الجهاز لو فيه WebGPU.
 * @returns {{ canvas, where: "cloud" | "device" }}
 */
export async function removeBackground(src, { onProgress, onReady, onDevice } = {}) {
  try {
    return { canvas: await cutoutCloud(src), where: "cloud" };
  } catch (e) {
    console.warn("cloud cutout failed", e);
  }
  if (typeof navigator === "undefined" || !navigator.gpu) throw new Error("no cutout available");
  onDevice?.();
  return { canvas: await cutoutCanvas(src, onProgress, onReady), where: "device" };
}

/** بيقص الفراغ الشفاف حوالين المنتج (عشان يتحط في نص المشهد بالظبط). بيرجّع null لو القص فشل */
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
