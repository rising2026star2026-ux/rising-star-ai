"use client";
// ضغط الصور وتحويل صيغتها: كذا صورة مرة واحدة
import { useEffect, useState } from "react";
import { Drop, Range, Seg, Note, Busy, styles as s } from "./ui";
import { IMAGE_TYPES, FORMATS, loadImage, makeCanvas, canvasToBlob, download, downloadAll, baseName, formatBytes, fitWithin, extFor } from "./util";
import { toast } from "@/lib/store";

const MAX_FILES = 30;

export default function Batch({ mode = "compress" }) {
  const compress = mode === "compress";
  const [items, setItems] = useState([]);
  const [quality, setQuality] = useState(75);
  const [maxSide, setMaxSide] = useState(compress ? 1920 : 0);
  const [format, setFormat] = useState(compress ? "jpg" : "png");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function add(files) {
    setError("");
    const room = MAX_FILES - items.length;
    if (files.length > room) setError(`أقصى عدد ${MAX_FILES} صورة مرة واحدة.`);
    const next = files.slice(0, Math.max(0, room)).map((file) => ({
      key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      thumb: URL.createObjectURL(file),
      out: null,
      err: "",
    }));
    setItems((x) => [...x, ...next]);
  }

  // أي تغيير في الإعدادات بيلغي النتايج القديمة
  useEffect(() => {
    setItems((x) => x.map((it) => ({ ...it, out: null, err: "" })));
  }, [quality, maxSide, format]);

  async function processAll() {
    setBusy(true);
    setError("");
    const done = [];
    for (const it of items) {
      if (it.out) { done.push(it); continue; }
      try {
        const img = await loadImage(it.file);
        const { w, h } = fitWithin(img.naturalWidth, img.naturalHeight, maxSide);
        const c = makeCanvas(w, h);
        const ctx = c.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        const blob = await canvasToBlob(c, format, quality / 100);
        done.push({ ...it, out: blob, dims: `${w}×${h}` });
      } catch (e) {
        done.push({ ...it, err: e.message || "مش قادر يفتح الصورة دي" });
      }
      setItems([...done, ...items.slice(done.length)]);
    }
    setBusy(false);
    const ok = done.filter((d) => d.out);
    if (ok.length) {
      const before = ok.reduce((a, d) => a + d.file.size, 0);
      const after = ok.reduce((a, d) => a + d.out.size, 0);
      toast(compress && after < before ? `وفّرت ${Math.round((1 - after / before) * 100)}% من الحجم` : "جاهزين للتحميل");
    }
  }

  function nameFor(it) {
    const ext = extFor(it.out, FORMATS[format].ext);
    return `${baseName(it.file.name)}${compress ? "-small" : ""}.${ext}`;
  }

  function remove(key) { setItems((x) => x.filter((i) => i.key !== key)); }

  const ready = items.filter((i) => i.out);
  const pending = items.some((i) => !i.out && !i.err);
  const webpFallback = ready.some((i) => format === "webp" && !i.out.type.includes("webp"));

  return (
    <div className={s.root}>
      <span className={s.badge}><i />بيشتغل على جهازك، وصورك ما بتترفعش</span>
      <Drop accept={IMAGE_TYPES} multiple onFiles={add} compact={items.length > 0} title={items.length ? "زوّد صور تانية" : undefined} />

      {items.length > 0 && (
        <>
          <div className={s.panel} style={{ position: "static" }}>
            <Seg
              label={compress ? "صيغة النتيجة" : "حوّل إلى"}
              value={format}
              options={compress ? [["jpg", "JPG (الأصغر للصور)"], ["webp", "WebP (أصغر وأحدث)"]] : [["png", "PNG"], ["jpg", "JPG"], ["webp", "WebP"]]}
              onChange={setFormat}
            />
            {(compress || format !== "png") && (
              <Range label="الجودة" value={quality} min={30} max={100} unit="%" onChange={setQuality} />
            )}
            <Seg
              label="أطول ضلع"
              value={maxSide}
              options={[[0, "زي ما هو"], [2560, "2560"], [1920, "1920"], [1280, "1280"], [800, "800"]]}
              onChange={setMaxSide}
            />
            {!compress && format === "jpg" && <Note>صيغة JPG مفيهاش شفافية، فالأجزاء الشفافة هتبقى بيضا.</Note>}
            {compress && <Note>جودة 70% إلى 80% غالباً بتصغّر الحجم للنص أو أقل، والفرق بالعين صعب يبان.</Note>}
          </div>

          <div className={s.list}>
            {items.map((it) => {
              const diff = it.out ? 1 - it.out.size / it.file.size : 0;
              return (
                <div key={it.key} className={s.item}>
                  <img className={s.thumb} src={it.thumb} alt="" />
                  <div className={s.itemText}>
                    <b dir="auto">{it.file.name}</b>
                    <small>
                      {formatBytes(it.file.size)}
                      {it.out && (
                        <>
                          {" ← "}{formatBytes(it.out.size)} · {it.dims}{" "}
                          {compress && <span className={diff > 0 ? s.saved : s.grew}>{diff > 0 ? `وفّرت ${Math.round(diff * 100)}%` : "الحجم زاد، قلّل الجودة"}</span>}
                        </>
                      )}
                      {it.err && <span className={s.grew}> · {it.err}</span>}
                    </small>
                  </div>
                  <div className={s.itemActions}>
                    {it.out && <button type="button" className={`${s.mini} ${s.miniAccent}`} onClick={() => download(it.out, nameFor(it))}>تحميل</button>}
                    <button type="button" className={s.mini} onClick={() => remove(it.key)} aria-label="شيل الصورة">✕</button>
                  </div>
                </div>
              );
            })}
          </div>

          {webpFallback && <Note tone="warn">المتصفح ده مش بيدعم حفظ WebP، فالصور اتحفظت PNG. جرّب كروم أو اختار JPG.</Note>}
          {error && <Note tone="warn">{error}</Note>}

          <div className={s.toolbar}>
            {busy ? (
              <Busy text={`بيجهز ${ready.length + 1} من ${items.length}...`} />
            ) : (
              <>
                {pending && <button type="button" className="btn" onClick={processAll}>{compress ? "اضغط الصور" : "حوّل الصور"}</button>}
                {ready.length > 1 && !pending && (
                  <button type="button" className="btn" onClick={() => downloadAll(ready.map((it) => ({ blob: it.out, name: nameFor(it) })))}>
                    تحميل الكل ({ready.length})
                  </button>
                )}
                <button type="button" className="btn ghost" onClick={() => setItems([])}>امسح الكل</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
