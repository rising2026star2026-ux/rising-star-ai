"use client";
// إزالة الخلفية بالذكاء الاصطناعي، على جهاز الزائر بالكامل (Transformers.js في المتصفح).
// مفيش سيرفر ومفيش مفتاح ومفيش حد: الموديل بيتحمّل مرة واحدة وبعدها بيفضل في كاش المتصفح.
// الموديل: BiRefNet lite (رخصة MIT، مسموح تجارياً).
import { useEffect, useRef, useState } from "react";
import { Drop, Seg, ColorField, Workbench, Note, Busy, styles as s } from "./ui";
import { IMAGE_TYPES, loadImage, makeCanvas, canvasToBlob, download, baseName, fitWithin, checker } from "./util";
import { toast } from "@/lib/store";

const TJS = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.1";
const MODEL = "onnx-community/BiRefNet_lite-ONNX";
const WORK_MAX = 2048;

let loader = null; // الموديل بيتحمّل مرة واحدة للصفحة كلها
function getModel(onProgress) {
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

export default function AiRemoveBg() {
  const [stage, setStage] = useState("empty"); // empty | load | work | done
  const [pct, setPct] = useState(0);
  const [name, setName] = useState("image");
  const [fill, setFill] = useState("none");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [error, setError] = useState("");
  const view = useRef(null);
  const cut = useRef(null); // canvas فيه الصورة بعد إزالة الخلفية (شفافة)

  useEffect(() => { paint(); }, [fill, fillColor, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  function paint() {
    const c = view.current, src = cut.current;
    if (!c || !src) return;
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext("2d");
    if (fill === "none") checker(ctx, c.width, c.height, Math.max(10, Math.round(c.width / 60)));
    else { ctx.fillStyle = fill === "white" ? "#ffffff" : fillColor; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(src, 0, 0);
  }

  async function open(files) {
    setError("");
    const file = files[0];
    setName(baseName(file.name));
    try {
      const im = await loadImage(file);
      const { w, h } = fitWithin(im.naturalWidth, im.naturalHeight, WORK_MAX);
      const base = makeCanvas(w, h);
      base.getContext("2d").drawImage(im, 0, 0, w, h);

      setStage("load"); setPct(0);
      const files = new Map();
      const { T, seg } = await getModel((p) => {
        if (p.status === "progress" && p.total) {
          files.set(p.file, [p.loaded, p.total]);
          let a = 0, b = 0;
          for (const [l, t] of files.values()) { a += l; b += t; }
          setPct(Math.round((a / b) * 100));
        }
      });

      setStage("work");
      const raw = await T.RawImage.fromBlob(await canvasToBlob(base, "png"));
      const out = await seg(raw);
      const mask = (Array.isArray(out) ? out[0] : out)?.mask;
      if (!mask) throw new Error("الموديل ما رجّعش نتيجة.");

      // نكبّر القناع لمقاس الصورة ونستخدمه كشفافية
      const mc = makeCanvas(w, h);
      const mctx = mc.getContext("2d", { willReadFrequently: true });
      mctx.drawImage(mask.toCanvas(), 0, 0, w, h);
      const m = mctx.getImageData(0, 0, w, h).data;
      const bctx = base.getContext("2d", { willReadFrequently: true });
      const px = bctx.getImageData(0, 0, w, h);
      for (let i = 0; i < px.data.length; i += 4) px.data[i + 3] = m[i];
      bctx.putImageData(px, 0, 0);
      cut.current = base;
      setStage("done");
    } catch (e) {
      console.error(e);
      setError("ما قدرناش نشغّل الذكاء الاصطناعي على الجهاز ده (ممكن المتصفح قديم أو الذاكرة قليلة). جرّب كروم أو إيدج محدّث، أو استخدم طريقة «لون الخلفية».");
      setStage("empty");
    }
  }

  async function save() {
    const src = cut.current;
    const c = makeCanvas(src.width, src.height);
    const ctx = c.getContext("2d");
    if (fill !== "none") { ctx.fillStyle = fill === "white" ? "#ffffff" : fillColor; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(src, 0, 0);
    const fmt = fill === "none" ? "png" : "jpg";
    download(await canvasToBlob(c, fmt, 0.92), `${name}-no-bg.${fmt}`);
    toast("اتحملت");
  }

  if (stage === "empty") {
    return (
      <div className={s.root}>
        <span className={s.badge}><i />بيشتغل على جهازك، وصورك ما بتترفعش</span>
        <Drop accept={IMAGE_TYPES} onFiles={open} hint="أي صورة: شخص، منتج، حيوان، عربية. أول مرة بس بيحمّل الموديل (حوالي 50 لـ100 ميجا) وبعدها بيبقى أسرع." />
        {error && <Note tone="warn">{error}</Note>}
      </div>
    );
  }
  if (stage === "load") return <div className={s.root}><Busy text={`بنحمّل موديل الذكاء الاصطناعي أول مرة... ${pct}%`} /><Note>ده بيحصل مرة واحدة بس، وبعدها الموديل بيفضل محفوظ في المتصفح.</Note></div>;
  if (stage === "work") return <div className={s.root}><Busy text="بنشيل الخلفية... (على الموبايل ممكن تاخد نص دقيقة)" /></div>;

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <span className={s.badge}><i />الخلفية اتشالت</span>
        <span className={s.spacer} />
        <button type="button" className="btn ghost" onClick={() => { cut.current = null; setStage("empty"); }}>صورة تانية</button>
      </div>
      <Workbench
        preview={<canvas ref={view} aria-label="الصورة بعد إزالة الخلفية" />}
        controls={
          <>
            <Seg label="الخلفية الجديدة" value={fill} options={[["none", "شفافة"], ["white", "بيضا"], ["color", "لون"]]} onChange={setFill} />
            {fill === "color" && <ColorField label="اللون" value={fillColor} onChange={setFillColor} />}
          </>
        }
        footer={<button type="button" className="btn" onClick={save}>تحميل {fill === "none" ? "PNG شفافة" : "الصورة"}</button>}
      />
    </div>
  );
}
