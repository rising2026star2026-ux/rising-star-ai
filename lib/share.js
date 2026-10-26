// ===================================================================
// أدوات المشاركة — دوال صافية من غير React عشان تتختبر لوحدها
// ===================================================================

export const BRAND = "Rising StarAi";
export const WA_MAX = 4000; // أقصى طول للنص في رابط واتساب

/** سطر التوقيع اللي بيتضاف في آخر الرسالة. */
export function brandLine(siteUrl = "") {
  return siteUrl ? `— من ${BRAND}\n${siteUrl}` : `— من ${BRAND}`;
}

/** تأمين النص قبل ما يتحط جوه HTML. */
export function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** اسم ملف آمن، والعربي بيفضل زي ما هو. */
export function safeFileName(name = "", fallback = "rising-star") {
  const clean = String(name)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return clean || fallback;
}

/**
 * تحويل Markdown لتنسيق واتساب.
 * واتساب بيفهم: *عريض*  _مائل_  ~مشطوب~  ```كود```
 */
export function toWhatsApp(md = "") {
  const lines = String(md).replace(/\r/g, "").split("\n");
  const out = [];
  let inCode = false;

  for (const raw of lines) {
    const line = raw;

    // كتل الكود بتفضل زي ما هي
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      out.push("```");
      continue;
    }
    if (inCode) {
      out.push(line);
      continue;
    }

    const t = line.trim();

    // سطر الفاصل في الجداول |---|---|
    if (/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(t)) continue;

    // صف جدول | أ | ب |  ←  أ — ب
    if (t.startsWith("|") && t.endsWith("|") && t.length > 1) {
      const cells = t.slice(1, -1).split("|").map((c) => c.trim()).filter(Boolean);
      out.push(inline(cells.join(" — ")));
      continue;
    }

    // خط أفقي
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      out.push("");
      continue;
    }

    // عنوان ## ← *عنوان*
    const h = t.match(/^#{1,6}\s+(.+)$/);
    if (h) {
      out.push(`*${stripBold(h[1])}*`);
      continue;
    }

    // نقطة - أو * أو + ← •
    const b = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (b) {
      out.push(`${b[1]}• ${inline(b[2])}`);
      continue;
    }

    out.push(inline(line));
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function stripBold(s) {
  return s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1");
}

function inline(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "*$1*")              // **عريض** ← *عريض*
    .replace(/__(.+?)__/g, "*$1*")
    .replace(/~~(.+?)~~/g, "~$1~")                  // ~~مشطوب~~ ← ~مشطوب~
    .replace(/`([^`]+)`/g, "```$1```")              // `كود` ← ```كود```
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")           // الصور بتتشال
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1: $2"); // [نص](رابط) ← نص: رابط
}

/** نص الرسالة الكامل لواتساب، مع القص لو طويل. */
export function whatsAppText(md, siteUrl = "", max = WA_MAX) {
  let body = toWhatsApp(md);
  const sign = brandLine(siteUrl);
  const room = max - sign.length - 4;
  if (body.length > room) {
    // نقص عند آخر سطر كامل عشان ما نقطعش في نص كلمة
    let cut = body.slice(0, room);
    const nl = cut.lastIndexOf("\n");
    if (nl > room * 0.6) cut = cut.slice(0, nl);
    body = `${cut.trimEnd()}\n…`;
  }
  return `${body}\n\n${sign}`;
}

/** رابط واتساب جاهز. */
export function whatsAppUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

// -------------------------------------------------------------------
// Word: ملف HTML بامتداد .doc — Word وGoogle Docs بيفتحوه بالعربي صح
// -------------------------------------------------------------------
export function wordDocument(title, html, siteUrl = "") {
  const t = escapeHtml(title);
  const foot = siteUrl
    ? `تم إنشاؤه بواسطة ${BRAND} — ${escapeHtml(siteUrl)}`
    : `تم إنشاؤه بواسطة ${BRAND}`;
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${t}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: Arial, Tahoma, sans-serif; font-size: 13pt; line-height: 1.7; color: #1a1a1a; direction: rtl; text-align: right; }
  p, li, h1, h2, h3, h4, td, th, blockquote { direction: rtl; text-align: right; }
  h1 { font-size: 20pt; font-weight: normal; color: #111; margin: 0 0 4pt; }
  h2 { font-size: 15pt; color: #7a5b12; margin: 16pt 0 6pt; }
  h3 { font-size: 13.5pt; color: #7a5b12; margin: 14pt 0 5pt; }
  ul, ol { margin: 4pt 0 10pt; }
  li { margin-bottom: 3pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  td, th { border: 1px solid #c8c8c8; padding: 5pt 8pt; vertical-align: top; }
  th { background: #f3efe4; font-weight: bold; }
  pre, code { direction: ltr; text-align: left; font-family: Consolas, "Courier New", monospace; font-size: 10.5pt; }
  pre { background: #f5f5f5; border: 1px solid #e0e0e0; padding: 8pt; }
  blockquote { border-right: 3px solid #cfa94d; margin: 8pt 0; padding: 2pt 10pt; color: #444; }
  .meta { color: #8a8a8a; font-size: 10pt; margin-bottom: 14pt; }
  .foot { color: #9a9a9a; font-size: 9.5pt; margin-top: 24pt; border-top: 1px solid #e5e5e5; padding-top: 6pt; }
</style>
</head>
<body dir="rtl">
<h1>${t}</h1>
<p class="meta">${escapeHtml(today())}</p>
${html}
<p class="foot">${foot}</p>
</body>
</html>`;
}

// -------------------------------------------------------------------
// PDF: صفحة طباعة نضيفة، والمستخدم يختار «حفظ كـ PDF»
// المتصفح بيرسم العربي صح، وده أضمن من أي مكتبة PDF
// -------------------------------------------------------------------
export function printDocument(title, html, siteUrl = "") {
  const t = escapeHtml(title);
  const foot = siteUrl
    ? `تم إنشاؤه بواسطة ${BRAND} — ${escapeHtml(siteUrl)}`
    : `تم إنشاؤه بواسطة ${BRAND}`;
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&display=swap">
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html { background: #f4f2ee; }
  body {
    margin: 0; color: #1b1b1f; background: #f4f2ee;
    font-family: "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif;
    font-size: 15px; line-height: 1.85;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .bar {
    position: sticky; top: 0; z-index: 2;
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;
    padding: 12px 16px; background: #111116; color: #e9e7e2; font-size: 13px;
  }
  .bar button {
    font: inherit; font-weight: 500; cursor: pointer; border: 0; border-radius: 10px;
    padding: 9px 18px; background: #cfa94d; color: #14120b;
  }
  main {
    max-width: 760px; margin: 24px auto; padding: 40px 44px; background: #fff;
    border-radius: 6px; box-shadow: 0 10px 40px -24px rgba(0,0,0,.35);
  }
  h1 { font-size: 26px; font-weight: 300; letter-spacing: -0.02em; line-height: 1.35; margin: 0 0 4px; }
  .meta { color: #8a8790; font-size: 12.5px; margin: 0 0 22px; padding-bottom: 14px; border-bottom: 1px solid #ece8df; }
  h2, h3 { color: #7a5b12; font-weight: 500; line-height: 1.5; margin: 22px 0 8px; }
  h2 { font-size: 18px; } h3 { font-size: 16px; }
  p { margin: 0 0 12px; }
  ul, ol { padding-inline-start: 22px; margin: 6px 0 14px; }
  li { margin-bottom: 5px; }
  strong, b { font-weight: 600; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13.5px; }
  th, td { border: 1px solid #ddd8cc; padding: 7px 10px; text-align: start; vertical-align: top; }
  th { background: #f6f2e8; font-weight: 500; }
  pre { direction: ltr; text-align: left; background: #f6f6f4; border: 1px solid #e6e3dc; border-radius: 8px; padding: 12px; overflow-x: auto; font-size: 12.5px; }
  code { direction: ltr; unicode-bidi: embed; font-family: Consolas, "Courier New", monospace; font-size: .9em; }
  blockquote { margin: 12px 0; padding: 4px 14px; border-inline-start: 3px solid #cfa94d; color: #555; }
  a { color: #7a5b12; }
  .foot { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ece8df; color: #9a97a0; font-size: 11.5px; }
  @media (max-width: 600px) { main { margin: 0; padding: 26px 20px; border-radius: 0; box-shadow: none; } }
  @media print {
    html, body { background: #fff; }
    .bar { display: none; }
    main { margin: 0; padding: 0; max-width: none; box-shadow: none; border-radius: 0; }
    h2, h3 { break-after: avoid; }
    table, pre, blockquote { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="bar">
  <span>من نافذة الطباعة اختار «حفظ كـ PDF»</span>
  <button type="button" onclick="window.print()">حفظ PDF</button>
</div>
<main>
  <h1>${t}</h1>
  <p class="meta">${escapeHtml(today())}</p>
  ${html}
  <p class="foot">${foot}</p>
</main>
<script>
  (function () {
    var done = false;
    function go() { if (done) return; done = true; window.print(); }
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () { setTimeout(go, 250); });
    setTimeout(go, 2200);
  })();
</script>
</body>
</html>`;
}

function today() {
  try {
    return new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** تحويل Markdown بسيط لـ HTML — بيتستخدم بس لو مفيش HTML جاهز من الصفحة. */
export function plainToHtml(md = "") {
  return String(md)
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}
