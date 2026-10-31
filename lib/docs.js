"use client";
// قراءة الملفات في متصفح الزائر وتحويلها لنص: PDF (بـ pdf.js)، وورد DOCX، وملفات النص، والصور والـ PDF المصوّر
// (بقارئ الصور /api/vision). الملف نفسه ما بيترفعش، النص بس هو اللي بيتبعت مع السؤال.

export const ACCEPT = ".pdf,.docx,.txt,.md,.csv,.json,.html,.htm,image/png,image/jpeg,image/webp,application/pdf";
export const MAX_FILE = 25 * 1024 * 1024;
export const MAX_CHARS = 400_000; // حوالي 250 صفحة كلام للملف الواحد
export const MAX_ALL = 600_000;   // كل الملفات مع بعض (نفس حد السيرفر في lib/doccontext.js)
export const MAX_COUNT = 20;
const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
const PDFJS_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
export const OCR_PAGES = 8; // أقصى عدد صفحات مصوّرة بنقراها (كل صفحة طلب لقارئ الصور)

const uid = () => Math.random().toString(36).slice(2, 10);
const clean = (t) => String(t || "").normalize("NFKC").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();

export function kindOf(file) {
  const n = (file.name || "").toLowerCase();
  if (file.type === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".docx")) return "docx";
  if (file.type.startsWith("image/")) return "image";
  if (/\.(txt|md|csv|json|html?)$/.test(n) || file.type.startsWith("text/")) return "text";
  return null;
}

export const KIND_ICON = { pdf: "📕", docx: "📘", text: "📄", image: "🖼️" };

let pdfjsP = null;
async function pdfjs() {
  if (!pdfjsP) {
    pdfjsP = import(/* webpackIgnore: true */ PDFJS).then((m) => {
      m.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return m;
    }).catch((e) => { pdfjsP = null; throw e; });
  }
  return pdfjsP;
}

async function canvasDataUrl(canvas, max = 1400) {
  const k = Math.min(1, max / Math.max(canvas.width, canvas.height));
  let c = canvas;
  if (k < 1) {
    c = document.createElement("canvas");
    c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k);
    c.getContext("2d").drawImage(canvas, 0, 0, c.width, c.height);
  }
  return c.toDataURL("image/jpeg", 0.85);
}

async function ocr(dataUrl, signal) {
  const r = await fetch("/api/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataUrl, mode: "ocr" }),
    signal,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "ما قدرناش نقرا الصورة.");
  return j.text || "";
}

// pdf.js بيرجّع الكلام قطع (أحياناً حرف حرف) بترتيب الرسم من الشمال لليمين. بنجمّع القطع لسطور حسب مكانها،
// ونرتّب السطر العربي من اليمين للشمال، ونحط مسافة لما يكون فيه فراغ حقيقي بين القطعتين.
const RTL_CH = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/g;
const LTR_CH = /[A-Za-z\u00C0-\u024F]/g;
function pageText(items) {
  const lines = [];
  for (const it of items) {
    if (typeof it.str !== "string" || !it.str) continue;
    const t = it.transform || [1, 0, 0, 1, 0, 0];
    const h = Math.abs(t[3]) || it.height || 10;
    const g = { s: it.str, x: t[4], y: t[5], w: it.width || 0, h };
    // السطر غالباً واحد من آخر كام سطر (الكلام بيترسم بالترتيب)
    let line = null;
    for (let k = lines.length - 1; k >= Math.max(0, lines.length - 4); k--) {
      const l = lines[k];
      if (Math.abs(l.y - g.y) < Math.max(2, Math.min(l.h, g.h) * 0.45)) { line = l; break; }
    }
    if (!line) { line = { y: g.y, h: g.h, items: [] }; lines.push(line); }
    if (g.s.trim()) line.h = Math.max(line.h, g.h);
    line.items.push(g);
  }
  lines.sort((a, b) => b.y - a.y);
  // المسافة العادية بين سطرين في نفس الفقرة (الوسيط)، وأي فراغ أكبر منها بوضوح = فقرة جديدة
  const gaps = lines.slice(1).map((l, i) => lines[i].y - l.y).filter((g) => g > 0).sort((a, b) => a - b);
  const usual = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;
  let out = "";
  let prevY = null;
  let prevRtl = false;
  for (const l of lines) {
    const all = l.items.map((g) => g.s).join("");
    const r = (all.match(RTL_CH) || []).length;
    const lt = (all.match(LTR_CH) || []).length;
    // سطر أرقام بس (زي «2026.») بياخد اتجاه الفقرة اللي قبله
    const rtl = r > lt || (!r && !lt && prevRtl);
    const its = [...l.items].sort((a, b) => (rtl ? b.x - a.x : a.x - b.x));
    let text = "";
    let prev = null;
    for (const g of its) {
      if (prev) {
        const gap = rtl ? prev.x - (g.x + g.w) : g.x - (prev.x + prev.w);
        if (gap > l.h * 0.16 && !/\s$/.test(text) && !/^\s/.test(g.s)) text += " ";
      }
      // رقم في آخر جملة عربية بيتسحب «.2026» بترتيب الرسم، فنرجّع العلامة لمكانها «2026.»
      text += rtl ? g.s.replace(/^([.,:;!?\u060C\u061B\u061F)\]]+)(\d[\d.,\u066B\u066C]*)$/, "$2$1") : g.s;
      prev = g;
    }
    text = text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (prevY !== null) out += usual && prevY - l.y > usual * 1.45 ? "\n\n" : "\n";
    out += text;
    prevY = l.y;
    prevRtl = rtl;
  }
  return out;
}

// pdf.js بيقلب «لا» لـ«ال» في ملفات كتير (زي اللي طالعة من Word وLibreOffice): الحرفين بييجوا من شكل واحد
// والمكتبة بتعكس النص كله. لو الملف فيه العلامة دي («اال» مش موجودة في العربي أصلاً) بنصلّح الحالات المضمونة.
const AR = "\u0621-\u064A";
const LAM_ALEF_WORDS = {
  خالل: "خلال", عالقة: "علاقة", عالقات: "علاقات", إعالن: "إعلان", اعالن: "اعلان", إعالنات: "إعلانات", اعالنات: "اعلانات",
  مالبس: "ملابس", كالم: "كلام", عمالء: "عملاء", زمالء: "زملاء", استالم: "استلام", استهالك: "استهلاك", إطالق: "إطلاق",
  انطالق: "انطلاق", بالد: "بلاد", صالحية: "صلاحية", تالميذ: "تلاميذ", أخالق: "أخلاق", مالحظة: "ملاحظة", مالحظات: "ملاحظات",
  الزم: "لازم", إسالم: "إسلام", حالل: "حلال", أفالم: "أفلام", افالم: "افلام", معامالت: "معاملات", تحليالت: "تحليلات",
  مجالت: "مجلات", إبالغ: "إبلاغ", ابالغ: "ابلاغ", فالن: "فلان", مثالً: "مثلاً", أصالً: "أصلاً",
  اصالً: "اصلاً", ثالثين: "ثلاثين", ثالثاء: "ثلاثاء",
  بالستيك: "بلاستيك", كالسيك: "كلاسيك", أونالين: "أونلاين", اونالين: "اونلاين", أوفالين: "أوفلاين",
  مشكالت: "مشكلات", موبايالت: "موبايلات", جالكسي: "جلاكسي",
};
function fixLamAlef(text) {
  const sig = (text.match(/ا[اإأآ]ل/g) || []).length + (text.match(new RegExp(`(^|[^${AR}])ال(?=$|[^${AR}])`, "gm")) || []).length;
  if (sig < 2) return text;
  return text
    .replace(/ا([اإأآ])ل/g, "ال$1")
    .replace(new RegExp(`(^|[^${AR}])ال(?=$|[^${AR}])`, "gm"), "$1لا")
    .replace(new RegExp(`[${AR}]+`, "g"), (w) => {
      if (LAM_ALEF_WORDS[w]) return LAM_ALEF_WORDS[w];
      // الكلمة ومعاها «ال» أو حرف في أولها: والإعلان، بالملابس، للاستلام
      for (const pre of LAM_PREFIXES) {
        if (w.startsWith(pre) && LAM_ALEF_WORDS[w.slice(pre.length)]) return pre + LAM_ALEF_WORDS[w.slice(pre.length)];
      }
      return w;
    });
}
const LAM_PREFIXES = ["وال", "فال", "بال", "كال", "لل", "ال", "و", "ف", "ب", "ك", "ل"];

async function readPdf(file, onProgress, signal) {
  const lib = await pdfjs();
  const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = doc.numPages;
  const parts = [];
  let total = 0;
  for (let i = 1; i <= pages && total < MAX_CHARS; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const txt = clean(pageText(tc.items));
    parts.push({ n: i, text: txt });
    total += txt.length;
    onProgress?.(`بنقرا صفحة ${i} من ${pages}`);
  }
  // PDF مصوّر (مفيهوش كلام حقيقي): نقرا أول صفحاته بقارئ الصور
  const avg = total / Math.max(1, parts.length);
  let ocred = false;
  if (avg < 40) {
    ocred = true;
    const n = Math.min(pages, OCR_PAGES);
    for (let i = 1; i <= n; i++) {
      if (signal?.aborted) throw new DOMException("aborted", "AbortError");
      onProgress?.(`الملف مصوّر، بنقرا الكلام من صفحة ${i} من ${n}…`);
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 1.6 });
      const c = document.createElement("canvas");
      c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      try { parts[i - 1] = { n: i, text: clean(await ocr(await canvasDataUrl(c), signal)) }; } catch (e) { if (e?.name === "AbortError") throw e; }
    }
  }
  const text = fixLamAlef(parts.filter((p) => p.text).map((p) => `--- صفحة ${p.n} ---\n${p.text}`).join("\n\n"));
  return { text, pages, ocred, partial: ocred && pages > OCR_PAGES };
}

// ملف DOCX = ملف zip جواه word/document.xml. بنفكه بأداة المتصفح نفسه (DecompressionStream)
async function readDocx(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const dv = new DataView(buf.buffer);
  // نهاية الأرشيف: آخر توقيع 0x06054b50
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("ملف الورد ده تالف أو مش DOCX.");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  for (let k = 0; k < count; k++) {
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen));
    if (name === "word/document.xml") {
      const lnlen = dv.getUint16(local + 26, true), lelen = dv.getUint16(local + 28, true);
      const start = local + 30 + lnlen + lelen;
      const raw = buf.subarray(start, start + csize);
      let xml;
      if (method === 0) xml = dec.decode(raw);
      else {
        const ds = new DecompressionStream("deflate-raw");
        const out = await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer();
        xml = dec.decode(out);
      }
      const text = xml
        .replace(/<w:(instrText|delText)[^>]*>[\s\S]*?<\/w:\1>/g, "")
        .replace(/<w:tab\/>/g, "\t").replace(/<w:br[^>]*\/>/g, "\n")
        // خانة الجدول: فقراتها جوه الخانة تبقى سطر واحد، والخانات يفصلها |
        .replace(/<w:tc[ >][\s\S]*?<\/w:tc>/g, (cell) => `${cell.replace(/<\/w:p>/g, " ").replace(/<[^>]+>/g, "").trim()} | `)
        .replace(/<\/w:tr>/g, "\n").replace(/<\/w:p>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")
        .replace(/ \| \n/g, "\n");
      return { text: clean(text), pages: null };
    }
    p += 46 + nlen + elen + clen;
  }
  throw new Error("مش لاقيين كلام جوه ملف الورد ده.");
}

async function readImage(file, signal) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("الصورة دي مش مدعومة.")); im.src = url; });
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext("2d").drawImage(img, 0, 0);
    return { text: clean(await ocr(await canvasDataUrl(c), signal)), pages: 1, ocred: true };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * بيرجّع { id, name, kind, pages, chars, text, ocred, partial, cut }
 * @param onProgress  رسالة حالة للواجهة
 */
export async function extractFile(file, { onProgress, signal } = {}) {
  const kind = kindOf(file);
  if (!kind) throw new Error("الصيغة دي مش مدعومة. ارفع PDF أو Word (DOCX) أو ملف نص أو صورة.");
  if (file.size > MAX_FILE) throw new Error("الملف أكبر من 25 ميجا.");
  let out;
  if (kind === "pdf") out = await readPdf(file, onProgress, signal);
  else if (kind === "docx") out = await readDocx(file);
  else if (kind === "image") { onProgress?.("بنقرا الكلام اللي في الصورة…"); out = await readImage(file, signal); }
  else out = { text: clean(await file.text()), pages: null };
  let text = out.text || "";
  if (text.length < 20) throw new Error(kind === "pdf" ? "الملف ده مفيهوش كلام نقدر نقراه." : "مش لاقيين كلام في الملف ده.");
  const cut = text.length > MAX_CHARS;
  if (cut) text = text.slice(0, MAX_CHARS);
  return { id: uid(), name: file.name.slice(0, 120), kind, pages: out.pages, chars: text.length, text, ocred: !!out.ocred, partial: !!out.partial, cut };
}

export function docLabel(d) {
  const size = d.chars > 1000 ? `${Math.round(d.chars / 1000)} ألف حرف` : `${d.chars} حرف`;
  if (d.kind === "image") return `صورة · ${size}`;
  return d.pages ? `${d.pages} ${d.pages === 1 ? "صفحة" : d.pages === 2 ? "صفحتين" : d.pages <= 10 ? "صفحات" : "صفحة"} · ${size}`.replace(/^2 صفحتين/, "صفحتين") : size;
}
