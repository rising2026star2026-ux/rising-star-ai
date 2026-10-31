"use client";
// تجهيز صور العميل في المتصفح قبل أي حاجة: تصغير، وتحويل لـ JPG/WebP خفيف، أو لرابط data.

export function readImage(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("الصورة دي مش مدعومة. جرّب صورة JPG أو PNG.")); };
    img.src = url;
  });
}

export function scaledCanvas(img, max) {
  const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height;
  const k = Math.min(1, max / Math.max(w0, h0));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w0 * k));
  c.height = Math.max(1, Math.round(h0 * k));
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export function canvasBlob(canvas, type = "image/jpeg", quality = 0.88) {
  return new Promise((resolve, reject) => {
    let src = canvas;
    if (type === "image/jpeg") {
      // JPG مالوش شفافية: نحط أبيض تحت
      src = document.createElement("canvas");
      src.width = canvas.width; src.height = canvas.height;
      const ctx = src.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, src.width, src.height);
      ctx.drawImage(canvas, 0, 0);
    }
    src.toBlob((b) => (b ? resolve(b) : reject(new Error("الصورة كبيرة على المتصفح ده."))), type, quality);
  });
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("ما قدرناش نقرا الملف."));
    r.readAsDataURL(blob);
  });
}

/** صورة → رابط data بحجم مناسب للإرسال للسيرفر (الذكاء الاصطناعي بيكفيه 1024 بكسل) */
export async function fileToDataUrl(file, max = 1024, quality = 0.85) {
  const img = await readImage(file);
  const c = scaledCanvas(img, max);
  return blobToDataUrl(await canvasBlob(c, "image/jpeg", quality));
}

/** مشاركة ملف من الموبايل (واتساب وغيره)، ولو مش مدعوم بننزّله */
export async function shareOrDownload(blob, filename, text = "") {
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return "shared";
    }
  } catch (e) {
    if (e?.name === "AbortError") return "cancelled";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return "downloaded";
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  try {
    const t = document.createElement("textarea");
    t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    const ok = document.execCommand("copy");
    t.remove();
    return ok;
  } catch { return false; }
}

/** تحميل خطوط الموقع قبل الرسم على الكانفاس */
export async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('800 64px "Alexandria"', "أبجد"),
      document.fonts.load('900 64px "Alexandria"', "أبجد"),
      document.fonts.load('600 40px "IBM Plex Sans Arabic"', "أبجد"),
      document.fonts.load('400 40px "IBM Plex Sans Arabic"', "أبجد"),
      document.fonts.load('900 64px "Archivo"', "Rising"),
    ]);
  } catch {}
}
export const DISPLAY_FONT = '"Alexandria", "IBM Plex Sans Arabic", system-ui, sans-serif';
export const UI_FONT = '"IBM Plex Sans Arabic", system-ui, sans-serif';
export const WORD_FONT = '"Archivo", system-ui, sans-serif';
