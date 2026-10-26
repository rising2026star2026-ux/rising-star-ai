"use client";
// أدوات PDF: صور إلى PDF، دمج، وتقسيم. كله على جهاز المستخدم بمكتبة pdf-lib.
import { useState } from "react";
import { Drop, Seg, Note, Busy, TextField, styles as s } from "./ui";
import { IMAGE_TYPES, loadImage, makeCanvas, canvasToBlob, download, downloadAll, baseName, formatBytes, readBytes, fitWithin } from "./util";
import { toast } from "@/lib/store";

const PDF = "application/pdf,.pdf";

// المكتبة بتتحمل بس لما المستخدم يدوس، عشان الصفحة تفضل خفيفة
const lib = () => import("pdf-lib");

const A4 = [595.28, 841.89];

export default function Pdf({ mode }) {
  if (mode === "merge") return <Merge />;
  if (mode === "split") return <Split />;
  return <ImagesToPdf />;
}

/* ============ قائمة ملفات بترتيب ============ */
function useOrderedList() {
  const [items, setItems] = useState([]);
  const add = (list) => setItems((x) => [...x, ...list]);
  const move = (i, d) => setItems((x) => {
    const j = i + d;
    if (j < 0 || j >= x.length) return x;
    const y = [...x];
    [y[i], y[j]] = [y[j], y[i]];
    return y;
  });
  const remove = (i) => setItems((x) => x.filter((_, k) => k !== i));
  return { items, setItems, add, move, remove };
}

function OrderedList({ items, move, remove, render }) {
  return (
    <div className={s.list}>
      {items.map((it, i) => (
        <div key={it.key} className={s.item}>
          {render(it, i)}
          <div className={s.itemActions}>
            <button type="button" className={s.mini} onClick={() => move(i, -1)} disabled={i === 0} aria-label="لفوق">↑</button>
            <button type="button" className={s.mini} onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="لتحت">↓</button>
            <button type="button" className={s.mini} onClick={() => remove(i)} aria-label="شيل">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const keyOf = (f) => `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`;

/* ============ صور إلى PDF ============ */
function ImagesToPdf() {
  const { items, setItems, add, move, remove } = useOrderedList();
  const [page, setPage] = useState("a4");
  const [margin, setMargin] = useState(24);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function onFiles(files) {
    add(files.slice(0, 100 - items.length).map((file) => ({ key: keyOf(file), file, thumb: URL.createObjectURL(file) })));
  }

  async function make() {
    setBusy(true);
    setError("");
    try {
      const { PDFDocument } = await lib();
      const doc = await PDFDocument.create();
      for (const it of items) {
        // بنعيد رسم كل صورة عشان اتجاه صور الموبايل يطلع مظبوط، وعشان أي صيغة تشتغل
        const img = await loadImage(it.file);
        const { w, h } = fitWithin(img.naturalWidth, img.naturalHeight, 2600);
        const c = makeCanvas(w, h);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const png = it.file.type === "image/png";
        const blob = await canvasToBlob(c, png ? "png" : "jpg", 0.9);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const embedded = png ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

        let pw, ph;
        if (page === "fit") { pw = w * 0.75 + margin * 2; ph = h * 0.75 + margin * 2; }
        else {
          const landscape = page === "auto" ? w > h : false;
          [pw, ph] = landscape ? [A4[1], A4[0]] : A4;
        }
        const p = doc.addPage([pw, ph]);
        const k = Math.min((pw - margin * 2) / w, (ph - margin * 2) / h);
        const dw = w * k, dh = h * k;
        p.drawImage(embedded, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
      }
      const out = await doc.save();
      const blob = new Blob([out], { type: "application/pdf" });
      download(blob, `${baseName(items[0].file.name)}-${items.length}-pages.pdf`);
      toast(`الـ PDF جاهز (${formatBytes(blob.size)})`);
    } catch (e) {
      setError(e.message || "حصلت مشكلة في عمل الملف.");
    } finally { setBusy(false); }
  }

  return (
    <div className={s.root}>
      <span className={s.badge}><i />بيشتغل على جهازك، وملفاتك ما بتترفعش</span>
      <Drop accept={IMAGE_TYPES} multiple onFiles={onFiles} compact={items.length > 0} title={items.length ? "زوّد صور" : "اسحب الصور هنا أو اضغط تختار"} hint="صور مستندات، فواتير، أو صفحات كشكول. رتّبها بعد ما ترفعها." />
      {items.length > 0 && (
        <>
          <OrderedList
            items={items}
            move={move}
            remove={remove}
            render={(it, i) => (
              <>
                <img className={s.thumb} src={it.thumb} alt="" />
                <div className={s.itemText}><b dir="auto">{i + 1}. {it.file.name}</b><small>{formatBytes(it.file.size)}</small></div>
              </>
            )}
          />
          <div className={s.panel} style={{ position: "static" }}>
            <Seg label="مقاس الصفحة" value={page} options={[["a4", "A4 طولي"], ["auto", "A4 على حسب الصورة"], ["fit", "على قد الصورة"]]} onChange={setPage} />
            <Seg label="الهامش" value={margin} options={[[0, "من غير"], [24, "صغير"], [48, "كبير"]]} onChange={setMargin} />
          </div>
          {error && <Note tone="warn">{error}</Note>}
          <div className={s.toolbar}>
            {busy ? <Busy text="بيجهز الـ PDF..." /> : (
              <>
                <button type="button" className="btn" onClick={make}>اعمل PDF ({items.length} {items.length === 1 ? "صفحة" : "صفحات"})</button>
                <button type="button" className="btn ghost" onClick={() => setItems([])}>امسح الكل</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ============ دمج PDF ============ */
function Merge() {
  const { items, setItems, add, move, remove } = useOrderedList();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(files) {
    setError("");
    const { PDFDocument } = await lib();
    const next = [];
    for (const file of files) {
      try {
        const doc = await PDFDocument.load(await readBytes(file), { ignoreEncryption: true });
        next.push({ key: keyOf(file), file, pages: doc.getPageCount() });
      } catch {
        setError(`الملف «${file.name}» مش PDF سليم أو عليه باسورد.`);
      }
    }
    add(next);
  }

  async function merge() {
    setBusy(true);
    setError("");
    try {
      const { PDFDocument } = await lib();
      const out = await PDFDocument.create();
      for (const it of items) {
        const src = await PDFDocument.load(await readBytes(it.file), { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const blob = new Blob([await out.save()], { type: "application/pdf" });
      download(blob, `merged-${items.length}-files.pdf`);
      toast(`اتدمجوا في ملف واحد (${formatBytes(blob.size)})`);
    } catch (e) {
      setError("مقدرتش أدمج الملفات. لو فيه ملف عليه باسورد، شيله الأول وجرّب تاني.");
    } finally { setBusy(false); }
  }

  const total = items.reduce((a, i) => a + i.pages, 0);

  return (
    <div className={s.root}>
      <span className={s.badge}><i />بيشتغل على جهازك، وملفاتك ما بتترفعش</span>
      <Drop accept={PDF} multiple onFiles={onFiles} compact={items.length > 0} title={items.length ? "زوّد ملفات PDF" : "اسحب ملفات PDF هنا أو اضغط تختار"} />
      {items.length > 0 && (
        <>
          <OrderedList
            items={items}
            move={move}
            remove={remove}
            render={(it, i) => (
              <>
                <span className={s.thumb}>PDF</span>
                <div className={s.itemText}><b dir="auto">{i + 1}. {it.file.name}</b><small>{it.pages} صفحة · {formatBytes(it.file.size)}</small></div>
              </>
            )}
          />
          <Note>الملفات هتتدمج بالترتيب ده. استخدم الأسهم عشان تغيّره.</Note>
          {error && <Note tone="warn">{error}</Note>}
          <div className={s.toolbar}>
            {busy ? <Busy text="بيدمج الملفات..." /> : (
              <>
                <button type="button" className="btn" onClick={merge} disabled={items.length < 2}>ادمج ({total} صفحة)</button>
                <button type="button" className="btn ghost" onClick={() => setItems([])}>امسح الكل</button>
              </>
            )}
          </div>
        </>
      )}
      {items.length === 0 && error && <Note tone="warn">{error}</Note>}
    </div>
  );
}

/* ============ تقسيم PDF ============ */
/** "1-3, 5, 8-" → أرقام الصفحات (من صفر) */
export function parseRanges(text, count) {
  const out = [];
  for (const part of String(text).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).split(/[,،\s]+/).filter(Boolean)) {
    const m = /^(\d*)\s*[-–]\s*(\d*)$/.exec(part);
    let a, b;
    if (m) { a = m[1] ? +m[1] : 1; b = m[2] ? +m[2] : count; }
    else if (/^\d+$/.test(part)) { a = b = +part; }
    else return null;
    if (a < 1 || b > count || a > b) return null;
    for (let i = a; i <= b; i++) out.push(i - 1);
  }
  return out.length ? out : null;
}

function Split() {
  const [file, setFile] = useState(null);
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState("pick");
  const [ranges, setRanges] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(files) {
    setError("");
    try {
      const { PDFDocument } = await lib();
      const doc = await PDFDocument.load(await readBytes(files[0]), { ignoreEncryption: true });
      setFile(files[0]);
      setCount(doc.getPageCount());
      setRanges(doc.getPageCount() > 1 ? `1-${Math.min(3, doc.getPageCount())}` : "1");
    } catch {
      setError("الملف ده مش PDF سليم أو عليه باسورد.");
    }
  }

  const picked = mode === "pick" ? parseRanges(ranges, count) : null;

  async function run() {
    setBusy(true);
    setError("");
    try {
      const { PDFDocument } = await lib();
      const src = await PDFDocument.load(await readBytes(file), { ignoreEncryption: true });
      const base = baseName(file.name);
      if (mode === "pick") {
        const out = await PDFDocument.create();
        (await out.copyPages(src, picked)).forEach((p) => out.addPage(p));
        download(new Blob([await out.save()], { type: "application/pdf" }), `${base}-pages.pdf`);
        toast(`اتحمل ملف فيه ${picked.length} صفحة`);
      } else {
        const files = [];
        for (let i = 0; i < count; i++) {
          const out = await PDFDocument.create();
          const [p] = await out.copyPages(src, [i]);
          out.addPage(p);
          files.push({ blob: new Blob([await out.save()], { type: "application/pdf" }), name: `${base}-page-${i + 1}.pdf` });
        }
        await downloadAll(files);
        toast(`اتحملت ${files.length} ملف`);
      }
    } catch (e) {
      setError("مقدرتش أقسم الملف. جرّب ملف تاني.");
    } finally { setBusy(false); }
  }

  return (
    <div className={s.root}>
      <span className={s.badge}><i />بيشتغل على جهازك، وملفاتك ما بتترفعش</span>
      <Drop accept={PDF} onFiles={onFiles} compact={!!file} title={file ? "ملف تاني" : "اسحب ملف PDF هنا أو اضغط تختار"} />
      {file && (
        <>
          <div className={s.item}>
            <span className={s.thumb}>PDF</span>
            <div className={s.itemText}><b dir="auto">{file.name}</b><small>{count} صفحة · {formatBytes(file.size)}</small></div>
          </div>
          <div className={s.panel} style={{ position: "static" }}>
            <Seg value={mode} options={[["pick", "طلّع صفحات معيّنة"], ["each", "كل صفحة في ملف"]]} onChange={setMode} />
            {mode === "pick" ? (
              <>
                <TextField label="الصفحات" value={ranges} onChange={setRanges} dir="ltr" inputMode="numeric" placeholder="1-3, 5, 8-10" maxLength={200} />
                <Note>
                  اكتب أرقام الصفحات بفاصلة، والشرطة معناها «من لحد». مثال: <bdi dir="ltr">1-3, 5</bdi> يعني الصفحات 1 و2 و3 و5.
                  {picked ? ` هيطلع ملف فيه ${picked.length} صفحة.` : ` الأرقام لازم تكون من 1 لـ ${count}.`}
                </Note>
              </>
            ) : (
              <Note>هيتحمل {count} ملف، والمتصفح ممكن يسألك مرة توافق على تحميل أكتر من ملف.</Note>
            )}
          </div>
          <div className={s.toolbar}>
            {busy ? <Busy /> : <button type="button" className="btn" onClick={run} disabled={mode === "pick" && !picked}>نفّذ</button>}
          </div>
        </>
      )}
      {error && <Note tone="warn">{error}</Note>}
    </div>
  );
}
