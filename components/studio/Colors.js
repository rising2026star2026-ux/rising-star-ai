"use client";
// ألوان من صورة: استخراج أهم ألوان أي صورة بأكوادها
import { useState } from "react";
import { Drop, Seg, Note, styles as s } from "./ui";
import { IMAGE_TYPES, loadImage, makeCanvas, hex, readableOn } from "./util";
import { toast } from "@/lib/store";

export default function Colors() {
  const [src, setSrc] = useState("");
  const [pixels, setPixels] = useState(null);
  const [count, setCount] = useState(6);
  const [colors, setColors] = useState([]);

  async function open(files) {
    try {
      const img = await loadImage(files[0]);
      setSrc(img.src);
      const k = Math.min(1, 160 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = makeCanvas(img.naturalWidth * k, img.naturalHeight * k);
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      const px = [];
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) px.push([d[i], d[i + 1], d[i + 2]]);
      setPixels(px);
      setColors(extractPalette(px, count));
    } catch (e) { toast(e.message); }
  }

  function changeCount(n) {
    setCount(n);
    if (pixels) setColors(extractPalette(pixels, n));
  }

  async function copy(text, msg = "اتنسخ") {
    try { await navigator.clipboard.writeText(text); toast(msg); } catch { toast("النسخ مش متاح في المتصفح ده"); }
  }

  const css = colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n");

  return (
    <div className={s.root}>
      <span className={s.badge}><i />بيشتغل على جهازك، وصورك ما بتترفعش</span>
      <Drop accept={IMAGE_TYPES} onFiles={open} compact={!!src} title={src ? "صورة تانية" : undefined} hint="لوجو، صورة منتج، أو أي صورة عاجبك ألوانها." />

      {src && colors.length > 0 && (
        <>
          <div className={s.bench}>
            <div className={s.stage}><img src={src} alt="الصورة اللي اتاخدت منها الألوان" /></div>
            <div className={s.panel}>
              <Seg label="عدد الألوان" value={count} options={[[4, "4"], [6, "6"], [8, "8"], [10, "10"]]} onChange={changeCount} />
              <div className={s.strip} aria-hidden="true">
                {colors.map((c) => <span key={c.hex} style={{ background: c.hex, "--w": Math.max(4, Math.round(c.share * 100)) }} />)}
              </div>
              <button type="button" className="btn" onClick={() => copy(colors.map((c) => c.hex).join(", "), "اتنسخت كل الأكواد")}>انسخ كل الأكواد</button>
              <button type="button" className="btn ghost" onClick={() => copy(`:root {\n${css}\n}`, "اتنسخ كود CSS")}>انسخ كـ CSS</button>
              <Note>دوس على أي لون عشان تنسخ كوده.</Note>
            </div>
          </div>
          <div className={s.palette}>
            {colors.map((c) => (
              <button key={c.hex} type="button" className={s.swatch} onClick={() => copy(c.hex)}>
                <span className={s.swatchColor} style={{ background: c.hex, color: c.on }}>{Math.round(c.share * 100)}%</span>
                <span className={s.swatchText}>
                  <code dir="ltr">{c.hex.toUpperCase()}</code>
                  <small dir="ltr">rgb({c.rgb.join(", ")})</small>
                  <small>{c.on === "#ffffff" ? "نص أبيض فوقه" : "نص غامق فوقه"}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** k-means بسيط: بيجمع البكسلات في مجموعات ويرجّع لون كل مجموعة ونسبتها */
export function extractPalette(px, k) {
  if (!px.length) return [];
  // بداية ثابتة (مش عشوائية) عشان نفس الصورة تدي نفس النتيجة كل مرة
  const sorted = [...px].sort((a, b) => lum(a) - lum(b));
  let centers = Array.from({ length: k }, (_, i) => [...sorted[Math.floor(((i + 0.5) / k) * sorted.length)]]);
  const assign = new Int32Array(px.length);
  for (let iter = 0; iter < 12; iter++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (let p = 0; p < px.length; p++) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = sq(px[p], centers[c]);
        if (d < bd) { bd = d; best = c; }
      }
      assign[p] = best;
      const s = sums[best];
      s[0] += px[p][0]; s[1] += px[p][1]; s[2] += px[p][2]; s[3]++;
    }
    centers = sums.map((s, i) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centers[i]));
  }
  const n = new Array(centers.length).fill(0);
  for (let p = 0; p < px.length; p++) n[assign[p]]++;
  // دمج الألوان المتشابهة جداً
  const out = [];
  centers.forEach((c, i) => {
    if (!n[i]) return;
    const near = out.find((o) => sq(o.c, c) < 260);
    if (near) { near.n += n[i]; return; }
    out.push({ c, n: n[i] });
  });
  // الدرجات اللي نسبتها صغيرة جداً غالباً حواف وظلال، مش ألوان حقيقية في الصورة
  const main = out.filter((o) => o.n / px.length >= 0.006);
  return (main.length >= 2 ? main : out)
    .sort((a, b) => b.n - a.n)
    .map(({ c, n: count }) => {
      const rgb = c.map((v) => Math.round(v));
      return { hex: hex(...rgb), rgb, share: count / px.length, on: readableOn(...rgb) };
    });
}

const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const sq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
