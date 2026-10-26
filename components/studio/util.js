// أدوات مشتركة لكل أدوات الاستوديو. كله بيشتغل جوه المتصفح، ومفيش أي ملف بيترفع لأي سيرفر.

export const IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif";

export const FORMATS = {
  png: { label: "PNG", mime: "image/png", ext: "png", lossy: false },
  jpg: { label: "JPG", mime: "image/jpeg", ext: "jpg", lossy: true },
  webp: { label: "WebP", mime: "image/webp", ext: "webp", lossy: true },
};

/** يفتح ملف صورة ويرجّع عنصر صورة جاهز للرسم */
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img); // الرابط بيفضل شغال طول ما الصفحة مفتوحة، عشان المعاينة
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("الصورة دي مش مدعومة في المتصفح ده. جرّب صورة JPG أو PNG."));
    };
    img.src = url;
  });
}

export function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** يحوّل الكانفاس لملف. JPG مالوش شفافية، فبنحط تحته أبيض */
export function canvasToBlob(canvas, format = "png", quality = 0.92) {
  const f = FORMATS[format] || FORMATS.png;
  let src = canvas;
  if (f.mime === "image/jpeg") {
    src = makeCanvas(canvas.width, canvas.height);
    const ctx = src.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, src.width, src.height);
    ctx.drawImage(canvas, 0, 0);
  }
  return new Promise((resolve, reject) => {
    src.toBlob(
      (b) => {
        if (!b) return reject(new Error("الصورة كبيرة جداً على المتصفح ده. صغّر المقاس وجرّب تاني."));
        // بعض المتصفحات القديمة مش بتدعم WebP وبترجّع PNG من غير ما تقول
        resolve(b);
      },
      f.mime,
      f.lossy ? quality : undefined
    );
  });
}

export function extFor(blob, fallback = "png") {
  const t = blob?.type || "";
  if (t.includes("jpeg")) return "jpg";
  if (t.includes("webp")) return "webp";
  if (t.includes("png")) return "png";
  if (t.includes("pdf")) return "pdf";
  return fallback;
}

/** اسم الملف من غير الامتداد */
export function baseName(name = "file") {
  const i = name.lastIndexOf(".");
  return (i > 0 ? name.slice(0, i) : name).slice(0, 60) || "file";
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/** تحميل كذا ملف ورا بعض (المتصفح ممكن يسألك مرة توافق على تحميل أكتر من ملف) */
export async function downloadAll(items) {
  for (const { blob, name } of items) {
    download(blob, name);
    await new Promise((r) => setTimeout(r, 450));
  }
}

export function formatBytes(n) {
  if (!Number.isFinite(n)) return "";
  if (n < 1024) return `${n} بايت`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} ك.ب`;
  return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 2 : 1)} م.ب`;
}

/** مقاس مناسب يحافظ على النسبة ومايعدّيش الحد */
export function fitWithin(w, h, max) {
  if (!max || (w <= max && h <= max)) return { w, h };
  const k = max / Math.max(w, h);
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function hex(r, g, b) {
  return "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
}

export function hexToRgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h).trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** لون النص المناسب (أسود أو أبيض) فوق لون معيّن */
export function readableOn(r, g, b) {
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return L > 0.6 ? "#111111" : "#ffffff";
}

/** الخط بتاع الموقع نفسه، عشان الكتابة على الصور تطلع بنفس الشكل */
export function siteFont() {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--ui").trim();
    return v || "system-ui, sans-serif";
  } catch {
    return "system-ui, sans-serif";
  }
}

export async function ensureFont(weight = 600) {
  try {
    await document.fonts.load(`${weight} 48px "IBM Plex Sans Arabic"`, "أبجد");
  } catch {
    // لو الخط ما اتحملش، الكانفاس هيستخدم خط النظام
  }
}

/** تقسيم الكلام لسطور على قد العرض المتاح */
export function wrapLines(ctx, text, maxWidth) {
  const out = [];
  for (const para of String(text).split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(""); continue; }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = `${line} ${words[i]}`;
      if (ctx.measureText(test).width <= maxWidth) line = test;
      else { out.push(line); line = words[i]; }
    }
    out.push(line);
  }
  return out;
}

/** خلفية مربعات عشان الشفافية تبان */
export function checker(ctx, w, h, size = 14) {
  ctx.fillStyle = "#d9d9de";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#f4f4f6";
  for (let y = 0; y < h; y += size) {
    for (let x = (y / size) % 2 ? size : 0; x < w; x += size * 2) ctx.fillRect(x, y, size, size);
  }
}

export async function readBytes(file) {
  return new Uint8Array(await file.arrayBuffer());
}
