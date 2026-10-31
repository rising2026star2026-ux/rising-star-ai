"use client";
// تحويل صفحات الكتالوج (كانفاس) لملف PDF، وكل زرار «اطلب» بيبقى لينك واتساب حقيقي جوه الملف
import { LAYOUTS } from "./catalogRender";

function jpegBytes(canvas, q = 0.86) {
  return new Promise((resolve, reject) => canvas.toBlob(async (b) => (b ? resolve(new Uint8Array(await b.arrayBuffer())) : reject(new Error("canvas"))), "image/jpeg", q));
}

export async function buildPdf(pages, layout, title = "كتالوج") {
  const { PDFDocument, PDFName, PDFString } = await import("pdf-lib");
  const L = LAYOUTS[layout] || LAYOUTS.phone;
  const [pw, ph] = L.pt;
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setCreator("Rising StarAi");
  doc.setProducer("Rising StarAi");
  for (const { canvas, links } of pages) {
    const img = await doc.embedJpg(await jpegBytes(canvas));
    const page = doc.addPage([pw, ph]);
    page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
    const k = pw / canvas.width;
    const annots = links.filter((l) => l.url).map((l) => doc.context.register(doc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [l.x * k, ph - (l.y + l.h) * k, (l.x + l.w) * k, ph - l.y * k],
      Border: [0, 0, 0],
      A: { Type: "Action", S: "URI", URI: PDFString.of(l.url) },
    })));
    if (annots.length) page.node.set(PDFName.of("Annots"), doc.context.obj(annots));
  }
  const bytes = await doc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

export async function pageImages(pages) {
  const out = [];
  for (let i = 0; i < pages.length; i++) {
    const b = await new Promise((r) => pages[i].canvas.toBlob(r, "image/jpeg", 0.9));
    out.push({ blob: b, name: `catalog-${i + 1}.jpg` });
  }
  return out;
}

// QR من مكتبة صغيرة مفتوحة المصدر (qrcode-generator، رخصة MIT) بتتحمّل وقت الحاجة بس
let qrLib = null;
export async function makeQr(text) {
  try {
    if (!qrLib) qrLib = import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm").then((m) => m.default || m);
    const qrcode = await qrLib;
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr;
  } catch {
    qrLib = null;
    return null;
  }
}
