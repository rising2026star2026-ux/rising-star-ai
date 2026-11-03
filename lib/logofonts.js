// تحميل خطوط اللوجو في المتصفح، وقياس النص، وتصدير SVG وPNG.
// الخطوط بتتحمّل من Fontsource (jsDelivr)، وبتتضمّن جوه ملف الـSVG عشان يظهر بنفس الشكل في أي مكان.
import { FONTS, FONT_RANGES, fontUrls, getFont } from "./logostudio";

const store = new Map(); // "fontId:subset" -> Promise<{ok, b64}>

async function fetchFirst(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.arrayBuffer();
    } catch { /* نجرب الرابط اللي بعده */ }
  }
  return null;
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function loadSubset(font, subset) {
  const key = `${font.id}:${subset}`;
  if (!store.has(key)) {
    store.set(key, (async () => {
      const buf = await fetchFirst(fontUrls(font, subset));
      if (!buf) return { ok: false };
      try {
        const face = new FontFace(font.family, buf, { weight: String(font.weight), unicodeRange: FONT_RANGES[subset] });
        await face.load();
        document.fonts.add(face);
        return { ok: true, b64: toBase64(buf) };
      } catch {
        return { ok: false };
      }
    })());
  }
  return store.get(key);
}

/** يحمّل الخط (العربي واللاتيني حسب النص). بيرجّع true لو الخط الأساسي اشتغل */
export async function ensureLogoFont(fontId, text = "") {
  const font = getFont(fontId);
  const needAr = /[؀-ۿ]/.test(text) || !text;
  const needLa = /[A-Za-z0-9]/.test(text) || !text;
  const jobs = [];
  if (needAr) jobs.push(loadSubset(font, "arabic"));
  if (needLa) jobs.push(loadSubset(font, "latin"));
  const res = await Promise.all(jobs);
  return res.some((r) => r.ok);
}

/** تعريفات @font-face بالخط مضمّن (Base64) لملف SVG لوحده */
export async function fontCssFor(fontId, text = "") {
  const font = getFont(fontId);
  await ensureLogoFont(fontId, text);
  let css = "";
  for (const subset of ["arabic", "latin"]) {
    const r = await loadSubset(font, subset);
    if (r.ok) css += `@font-face{font-family:'${font.family}';font-weight:${font.weight};src:url(data:font/woff2;base64,${r.b64}) format('woff2');unicode-range:${FONT_RANGES[subset]};}`;
  }
  return css;
}

let ctx = null;
/** عرض النص بوحدة em (من قياس حقيقي في المتصفح) */
export function measureEm(text, font) {
  if (typeof document === "undefined") return 0;
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `${font.weight} 100px '${font.family}', Cairo, Tahoma, Arial, sans-serif`;
  return ctx.measureText(text).width / 100;
}

/** يحوّل SVG (فيه width وheight) لصورة PNG. الخلفية شفافة إلا لو SVG نفسه فيه خلفية */
export async function svgToPng(svg, width, height) {
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const draw = async () => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    return canvas;
  };
  // أول رسمة ممكن الخط المضمّن لسه ما اتفعّلش فيها، فبنرسم مرتين ونأخد التانية
  await draw();
  await new Promise((r) => setTimeout(r, 80));
  const canvas = await draw();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png"));
}

export { FONTS };
