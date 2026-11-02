// مولد QR: بناء النص اللي بيتحط جوه الرمز (رابط، واتساب، واي فاي، كارت...) ورسم الرمز كـ SVG.
// دوال صافية من غير شبكة ومن غير DOM، فتتجرّب بسهولة. المكتبة اللي بتحوّل النص لمربعات بتتحمّل في المكوّن.

export const COUNTRIES = {
  eg: { name: "مصر", code: "20" },
  sa: { name: "السعودية", code: "966" },
  other: { name: "دولة تانية", code: "" },
};

export const QR_TYPES = [
  ["url", "رابط"],
  ["whatsapp", "واتساب"],
  ["text", "نص"],
  ["phone", "تليفون"],
  ["email", "إيميل"],
  ["wifi", "واي فاي"],
  ["vcard", "كارت شخصي"],
];

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** أرقام عربية وفارسية → إنجليزية */
export function latinDigits(s) {
  return String(s ?? "").replace(/[٠-٩۰-۹]/g, (d) => {
    const i = AR_DIGITS.indexOf(d);
    return String(i >= 0 ? i : FA_DIGITS.indexOf(d));
  });
}

/** رقم تليفون → أرقام بكود الدولة من غير + (مثلاً 01012345678 في مصر → 201012345678) */
export function normalizePhone(raw, country = "eg") {
  let s = latinDigits(raw).trim();
  if (!s) return { error: "اكتب رقم التليفون." };
  const intl = s.startsWith("+") || s.startsWith("00");
  s = s.replace(/\D/g, "");
  if (s.startsWith("00")) s = s.slice(2);
  const code = COUNTRIES[country]?.code || "";
  if (!intl && code) {
    if (s.startsWith("0")) s = code + s.slice(1);
    else if (!s.startsWith(code)) s = code + s;
  }
  if (!intl && !code && s.startsWith("0")) return { error: "اكتب الرقم بكود الدولة، مثلاً 4915112345678." };
  if (s.length < 8 || s.length > 15) return { error: "الرقم ده مش شكله صح. راجع الأرقام وكود الدولة." };
  return { value: s };
}

const HEX = /^#[0-9a-f]{6}$/i;

// الرموز الخاصة بتتحط قبلها \ . بنعمل escape بس من غير علامات تنصيص، لأن بعض الموبايلات بتعتبر العلامات جزء من اسم الشبكة
function escWifi(v) {
  return String(v).replace(/([\\;,:"])/g, "\\$1");
}

function escCard(v) {
  return String(v).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

const MAX_TEXT = 1000;

/** يرجّع { text } للنص اللي هيتكتب في الرمز، أو { error } برسالة بالعربي. */
export function buildPayload(type, f = {}) {
  const t = (k) => String(f[k] ?? "").trim();
  switch (type) {
    case "url": {
      let v = t("url");
      if (!v) return { error: "اكتب الرابط." };
      if (/\s/.test(v)) return { error: "الرابط فيه مسافات. شيلها أو اكتبه من غير مسافات." };
      const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(v);
      if (scheme && /^(javascript|data|vbscript|file)$/i.test(scheme[1])) return { error: "نوع الرابط ده مش مسموح." };
      // "localhost:3000" بيتفهم كأن localhost هو البروتوكول، فبنفرّق بينه وبين http: وغيره
      if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v) && !/^(mailto|tel|sms|geo):/i.test(v)) v = `https://${v}`;
      try { new URL(v); } catch { return { error: "الرابط مش مظبوط. مثال: example.com" }; }
      return { text: v };
    }
    case "whatsapp": {
      const p = normalizePhone(f.phone, f.country);
      if (p.error) return { error: p.error };
      const msg = String(f.msg ?? "").trim();
      return { text: `https://wa.me/${p.value}${msg ? `?text=${encodeURIComponent(msg)}` : ""}` };
    }
    case "text": {
      const v = String(f.text ?? "").trim();
      if (!v) return { error: "اكتب النص." };
      if (v.length > MAX_TEXT) return { error: `النص طويل (أقصاه ${MAX_TEXT} حرف).` };
      return { text: v };
    }
    case "phone": {
      const p = normalizePhone(f.phone, f.country);
      if (p.error) return { error: p.error };
      return { text: `tel:+${p.value}` };
    }
    case "email": {
      const addr = latinDigits(t("email"));
      if (!addr) return { error: "اكتب الإيميل." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return { error: "الإيميل مش مظبوط." };
      const q = [];
      if (t("subject")) q.push(`subject=${encodeURIComponent(t("subject"))}`);
      if (t("body")) q.push(`body=${encodeURIComponent(t("body"))}`);
      return { text: `mailto:${addr}${q.length ? `?${q.join("&")}` : ""}` };
    }
    case "wifi": {
      const ssid = String(f.ssid ?? "");
      if (!ssid.trim()) return { error: "اكتب اسم الشبكة." };
      const sec = ["WPA", "WEP", "nopass"].includes(f.sec) ? f.sec : "WPA";
      const pass = String(f.pass ?? "");
      if (sec !== "nopass" && !pass) return { error: "اكتب كلمة سر الشبكة، أو اختار «من غير كلمة سر»." };
      if (sec === "WPA" && pass.length < 8) return { error: "كلمة سر الواي فاي من نوع WPA لازم تبقى 8 حروف على الأقل." };
      return { text: `WIFI:T:${sec};S:${escWifi(ssid)};${sec === "nopass" ? "" : `P:${escWifi(pass)};`}${f.hidden ? "H:true;" : ""};` };
    }
    case "vcard": {
      const name = t("name");
      if (!name) return { error: "اكتب الاسم." };
      const lines = ["BEGIN:VCARD", "VERSION:3.0"];
      const parts = name.split(/\s+/);
      const last = parts.length > 1 ? parts.pop() : "";
      lines.push(`N:${escCard(last)};${escCard(parts.join(" "))};;;`, `FN:${escCard(name)}`);
      if (t("org")) lines.push(`ORG:${escCard(t("org"))}`);
      if (t("title")) lines.push(`TITLE:${escCard(t("title"))}`);
      if (t("phone")) {
        const p = normalizePhone(f.phone, f.country);
        if (p.error) return { error: p.error };
        lines.push(`TEL;TYPE=CELL:+${p.value}`);
      }
      if (t("email")) {
        const addr = latinDigits(t("email"));
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return { error: "الإيميل مش مظبوط." };
        lines.push(`EMAIL:${addr}`);
      }
      if (t("site")) {
        const u = /^[a-z][a-z0-9+.-]*:\/\//i.test(t("site")) ? t("site") : `https://${t("site")}`;
        if (/\s/.test(u)) return { error: "رابط الموقع فيه مسافات." };
        lines.push(`URL:${u}`);
      }
      if (lines.length <= 4) return { error: "ضيف رقم أو إيميل أو موقع مع الاسم، عشان الكارت يبقى مفيد." };
      lines.push("END:VCARD");
      return { text: lines.join("\r\n") };
    }
    default:
      return { error: "نوع غير معروف." };
  }
}

/* ============ الألوان ============ */

function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** تحذير لو الألوان هتخلي الرمز صعب القراءة (فاضي لو كله تمام) */
export function colorWarning(fg, bg) {
  if (!HEX.test(fg) || !HEX.test(bg)) return "";
  if (luminance(fg) > luminance(bg)) return "الرمز أفتح من الخلفية. كتير من الكاميرات مش بتقرا الرموز المعكوسة، فخلّي الرمز هو الأغمق.";
  if (contrastRatio(fg, bg) < 3) return "الرمز والخلفية قريبين من بعض في اللون، وممكن الرمز ما يتقراش. غمّق لون الرمز أو فتّح الخلفية.";
  return "";
}

/* ============ الرسم ============ */

export const DOT_STYLES = [["square", "مربعات"], ["rounded", "حواف ناعمة"], ["dots", "دوائر"]];
export const QUIET = 4; // الهامش الأبيض حوالين الرمز، 4 مربعات حسب المواصفة

const f2 = (x) => (Math.round(x * 100) / 100).toString();

/**
 * يرسم الرمز كـ SVG.
 * n: عدد المربعات في الضلع، isDark(row, col): هل المربع غامق
 * logo: رابط data لصورة اللوجو (اختياري)، logoPct: عرض اللوجو كنسبة من عرض الرمز
 */
export function qrSvg({ n, isDark, fg = "#111111", bg = "#ffffff", size = 1024, style = "square", logo = "", logoPct = 20 }) {
  if (!HEX.test(fg)) fg = "#111111";
  if (!HEX.test(bg)) bg = "#ffffff";
  const W = n + QUIET * 2;
  const side = logo ? (n * Math.min(30, Math.max(8, logoPct))) / 100 : 0;
  const half = side / 2, mid = W / 2;
  const hidden = (r, c) => logo && Math.abs(c + 0.5 + QUIET - mid) < half && Math.abs(r + 0.5 + QUIET - mid) < half;
  const finder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  let square = "", circles = "", rects = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!isDark(r, c) || hidden(r, c)) continue;
      const x = c + QUIET, y = r + QUIET;
      if (style === "square" || finder(r, c)) square += `M${x} ${y}h1v1h-1z`;
      else if (style === "dots") circles += `M${f2(x + 0.04)} ${f2(y + 0.5)}a0.46 0.46 0 1 0 0.92 0a0.46 0.46 0 1 0-0.92 0z`;
      else rects += `<rect x="${f2(x + 0.03)}" y="${f2(y + 0.03)}" width="0.94" height="0.94" rx="0.16"/>`;
    }
  }

  let out = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${W}" width="${size}" height="${size}">`;
  out += `<rect width="${W}" height="${W}" fill="${bg}"/>`;
  out += `<g fill="${fg}">`;
  if (square) out += `<path shape-rendering="crispEdges" d="${square}"/>`;
  if (circles) out += `<path d="${circles}"/>`;
  out += rects;
  out += `</g>`;
  if (logo) {
    const img = side * 0.84;
    out += `<rect x="${f2(mid - half)}" y="${f2(mid - half)}" width="${f2(side)}" height="${f2(side)}" rx="${f2(side * 0.14)}" fill="${bg}"/>`;
    // الرابط لازم يكون data: بس، عشان ما يتحطش أي عنوان خارجي جوه الرمز
    if (/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(logo)) {
      out += `<image x="${f2(mid - img / 2)}" y="${f2(mid - img / 2)}" width="${f2(img)}" height="${f2(img)}" preserveAspectRatio="xMidYMid meet" href="${logo}" xlink:href="${logo}"/>`;
    }
  }
  return `${out}</svg>`;
}
