"use client";
// تحسين صورة بعد التوليد: كثافة ألوان، حدّة، وتكبير لدقة أعلى. كله بيشتغل على جهازك.
// المعاينة بتتعمل على نسخة صغيرة (سريعة)، والتطبيق الكامل بيشتغل على الصورة بحجمها الأصلي ثم بيكبّرها.
import { useCallback, useEffect, useRef, useState } from "react";
import { Seg, Range, Note, Busy, styles as s } from "./ui";
import { download } from "./util";
import { autoColor, unsharp, upscalePlan } from "@/lib/imgenhance";

const PREVIEW_MAX = 900;
const tick = () => new Promise((r) => setTimeout(r, 0));

async function loadBitmap(source) {
  const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
  if (typeof createImageBitmap === "function") return createImageBitmap(blob);
  return new Promise((ok, no) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => no(new Error("الصورة دي مش مدعومة."));
    img.src = URL.createObjectURL(blob);
  });
}

const dims = (b) => [b.width || b.naturalWidth, b.height || b.naturalHeight];

function canvasOf(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** يكبّر الكانفاس على خطوات (لحد ضعفين في الخطوة) بتنعيم عالي الجودة */
function scaleCanvas(src, tw, th) {
  let cur = src;
  while (cur.width < tw || cur.height < th) {
    const nw = Math.min(tw, Math.round(cur.width * 2)), nh = Math.min(th, Math.round(cur.height * 2));
    const next = canvasOf(nw, nh);
    const ctx = next.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(cur, 0, 0, nw, nh);
    cur = next;
  }
  return cur;
}

const toBlob = (c, type, q) => new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("الصورة كبيرة على المتصفح ده. جرّب تكبير أقل."))), type, q));

export default function ImageEnhancer({ source, name = "rising-star", onUse }) {
  const [color, setColor] = useState(70);
  const [sharp, setSharp] = useState(35);
  const [scale, setScale] = useState(2);
  const [fmt, setFmt] = useState("jpg");
  const [size, setSize] = useState(null); // [w, h] الأصلي
  const [loadErr, setLoadErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [holdOrig, setHoldOrig] = useState(false);
  const [err, setErr] = useState("");

  const bitmapRef = useRef(null);
  const baseRef = useRef(null); // ImageData للنسخة الصغيرة الأصلية
  const origCv = useRef(null);
  const newCv = useRef(null);

  // تحميل الصورة وتجهيز النسخة الصغيرة
  useEffect(() => {
    let dead = false;
    setLoadErr(""); setSize(null); baseRef.current = null;
    (async () => {
      try {
        const bmp = await loadBitmap(source);
        if (dead) return;
        bitmapRef.current = bmp;
        const [w, h] = dims(bmp);
        setSize([w, h]);
        const k = Math.min(1, PREVIEW_MAX / Math.max(w, h));
        const c = canvasOf(w * k, h * k);
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(bmp, 0, 0, c.width, c.height);
        baseRef.current = ctx.getImageData(0, 0, c.width, c.height);
        for (const ref of [origCv, newCv]) { ref.current.width = c.width; ref.current.height = c.height; }
        origCv.current.getContext("2d").putImageData(baseRef.current, 0, 0);
        draw(color, sharp);
      } catch (e) {
        if (!dead) setLoadErr(e?.name === "TypeError" ? "ما قدرناش نفتح الصورة (الرابط ممكن يمنع التحميل). جرّب تنزّلها وترفعها." : e?.message || "ما قدرناش نفتح الصورة.");
      }
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => () => { try { bitmapRef.current?.close?.(); } catch {} }, []);

  const draw = useCallback((c, sh) => {
    const base = baseRef.current;
    if (!base || !newCv.current) return;
    const img = { data: new Uint8ClampedArray(base.data), width: base.width, height: base.height };
    autoColor(img, { color: c / 100 });
    unsharp(img, { radius: 1, amount: (sh / 100) * 0.9, threshold: 3 });
    newCv.current.getContext("2d").putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
  }, []);

  // المعاينة بتتحدّث بعد ما الزائر يسيب المؤشر لحظة قصيرة
  useEffect(() => {
    const t = setTimeout(() => draw(color, sharp), 90);
    return () => clearTimeout(t);
  }, [color, sharp, draw, size]);

  const plan = size ? upscalePlan(size[0], size[1], scale) : null;

  async function render() {
    const bmp = bitmapRef.current;
    const [w, h] = dims(bmp);
    // 1) الألوان على الحجم الأصلي (أرخص)، 2) التكبير، 3) الحدّة على الحجم النهائي
    const c0 = canvasOf(w, h);
    const x0 = c0.getContext("2d", { willReadFrequently: true });
    x0.drawImage(bmp, 0, 0);
    const d0 = x0.getImageData(0, 0, w, h);
    autoColor(d0, { color: color / 100 });
    x0.putImageData(d0, 0, 0);
    await tick();
    const p = upscalePlan(w, h, scale);
    const big = p.factor > 1 ? scaleCanvas(c0, p.width, p.height) : c0;
    await tick();
    const xb = big.getContext("2d", { willReadFrequently: true });
    const db = xb.getImageData(0, 0, big.width, big.height);
    unsharp(db, { radius: Math.max(1, Math.round(p.factor * 0.8)), amount: (sharp / 100) * 0.9, threshold: 3 });
    xb.putImageData(db, 0, 0);
    await tick();
    return fmt === "png" ? { blob: await toBlob(big, "image/png"), ext: "png" } : { blob: await toBlob(big, "image/jpeg", 0.95), ext: "jpg" };
  }

  async function run(action) {
    if (busy || !bitmapRef.current) return;
    setBusy(true); setErr("");
    await tick();
    try {
      const { blob, ext } = await render();
      if (action === "download") download(blob, `${name}-hd.${ext}`);
      else onUse?.(blob);
    } catch (e) {
      setErr(e instanceof RangeError ? "الجهاز مش قادر على المقاس ده. جرّب تكبير أقل." : e?.message || "ما قدرناش نكمّل. جرّب تكبير أقل.");
    } finally {
      setBusy(false);
    }
  }

  if (loadErr) return <Note tone="warn">{loadErr}</Note>;

  return (
    <div className={s.root}>
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid var(--hairline)", background: "var(--field)", lineHeight: 0 }}>
        <canvas ref={origCv} style={{ width: "100%", height: "auto", display: holdOrig ? "block" : "none" }} aria-label="الصورة الأصلية" />
        <canvas ref={newCv} style={{ width: "100%", height: "auto", display: holdOrig ? "none" : "block" }} aria-label="الصورة بعد التحسين" />
        {!size && <div style={{ padding: 30 }}><Busy text="بنفتح الصورة..." /></div>}
        <button type="button" className="btn ghost" style={{ position: "absolute", insetInlineEnd: 10, bottom: 10, lineHeight: 1.4 }}
          onPointerDown={() => setHoldOrig(true)} onPointerUp={() => setHoldOrig(false)} onPointerLeave={() => setHoldOrig(false)} onPointerCancel={() => setHoldOrig(false)}
          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") setHoldOrig(true); }} onKeyUp={() => setHoldOrig(false)}>
          {holdOrig ? "دي الأصلية" : "اضغط مطولاً للأصلية"}
        </button>
      </div>
      <Range label="كثافة الألوان والتباين" value={color} min={0} max={100} step={5} onChange={setColor} unit="%" />
      <Range label="الحدّة" value={sharp} min={0} max={100} step={5} onChange={setSharp} unit="%" />
      <Seg label="التكبير" value={scale} onChange={setScale} options={[[1, "بدون"], [2, "2×"], [3, "3×"], [4, "أقصى"]]} />
      {plan && <Note>الناتج: {plan.width}×{plan.height} بكسل{plan.factor < scale ? " (ده أقصى مقاس يتحمّله المتصفح)" : ""}. التكبير بيخلّي الصورة أكبر وأحدّ، لكنه مش بيضيف تفاصيل جديدة زي مكبّرات الذكاء الاصطناعي.</Note>}
      <Seg label="صيغة الملف" value={fmt} onChange={setFmt} options={[["jpg", "JPG (أخف)"], ["png", "PNG (أنقى وأتقل)"]]} />
      <button type="button" className="btn" disabled={busy || !size} onClick={() => run("download")}>{busy ? "بنجهّز الصورة بالجودة العالية…" : "نزّل الصورة المحسّنة"}</button>
      {onUse && <button type="button" className="btn ghost" disabled={busy || !size} onClick={() => run("use")}>استخدم النتيجة مكان الصورة</button>}
      {err && <Note tone="warn">{err}</Note>}
    </div>
  );
}
