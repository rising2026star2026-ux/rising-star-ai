"use client";
// مشاهد تصوير المنتج: المنتج بعد ما خلفيته اتشالت بيتحط في مشهد مرسوم بالكود (ضوء، ظل، انعكاس، بوديوم).
// كله على جهاز العميل وببلاش، والمنتج نفسه بيفضل زي ما هو بالظبط (مفيش ذكاء اصطناعي بيغيّر شكله).
import { DISPLAY_FONT, UI_FONT } from "@/lib/imagefile";

export const FORMATS = {
  square: { w: 1080, h: 1080, name: "مربع (بوست)" },
  story: { w: 1080, h: 1920, name: "طولي (ستوري وريلز)" },
};

export const SCENES = [
  { id: "studio", name: "استوديو أبيض", hint: "نضيف ومناسب لأي منتج" },
  { id: "podium", name: "بوديوم", hint: "شكل البراندات الكبيرة" },
  { id: "luxury", name: "فخامة", hint: "للعطور والساعات والإكسسوار" },
  { id: "sunlight", name: "ضوء الشباك", hint: "دافي وطبيعي" },
  { id: "bold", name: "ألوان جريئة", hint: "يلفت النظر في الزحمة" },
  { id: "offer", name: "إعلان جاهز", hint: "الاسم والسعر وطريقة الطلب" },
];

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

/** نسخة سودا من المنتج (للظل) */
function silhouette(src, color = "#000") {
  const c = canvas(src.width, src.height);
  const x = c.getContext("2d");
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

/** تغبيش بيشتغل على كل المتصفحات (تصغير وتكبير)، بدل ctx.filter اللي سفاري القديم مش بيدعمه */
function blurred(src, amount = 0.08) {
  const k = Math.max(0.02, amount);
  const sw = Math.max(2, Math.round(src.width * k)), sh = Math.max(2, Math.round(src.height * k));
  const small = canvas(sw, sh);
  const sx = small.getContext("2d");
  sx.imageSmoothingQuality = "high";
  sx.drawImage(src, 0, 0, sw, sh);
  const mid = canvas(sw * 2, sh * 2);
  const mx = mid.getContext("2d");
  mx.imageSmoothingQuality = "high";
  mx.drawImage(small, 0, 0, mid.width, mid.height);
  return mid;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** مكان المنتج في المشهد: قاعدته على خط bottom، ومتوسّط أفقياً */
function fit(prod, { cx, bottom, maxW, maxH }) {
  const k = Math.min(maxW / prod.width, maxH / prod.height);
  const w = prod.width * k, h = prod.height * k;
  return { x: cx - w / 2, y: bottom - h, w, h, cx, bottom };
}

function contactShadow(ctx, r, alpha = 0.38, spread = 0.56) {
  const rx = r.w * spread, ry = Math.max(10, r.w * 0.07);
  ctx.save();
  ctx.translate(r.cx, r.bottom - ry * 0.15);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`);
  g.addColorStop(0.45, `rgba(0,0,0,${alpha * 0.45})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function softShadow(ctx, prod, r, { dx = 0, dy = 0.04, alpha = 0.22, blur = 0.06, color = "#000" } = {}) {
  const sh = blurred(silhouette(prod, color), blur);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(sh, r.x + dx * r.w, r.y + dy * r.h, r.w, r.h);
  ctx.restore();
}

/** ظل طويل على الأرض (ضوء جانبي) */
function castShadow(ctx, prod, r, { skew = -0.9, squash = 0.3, alpha = 0.22 } = {}) {
  const sh = blurred(silhouette(prod), 0.1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(r.cx, r.bottom);
  ctx.transform(1, 0, skew, -squash, 0, 0); // انعكاس رأسي + ميل = ظل نايم على الأرض
  ctx.drawImage(sh, -r.w / 2, -r.h, r.w, r.h);
  ctx.restore();
}

function reflection(ctx, prod, r, alpha = 0.22) {
  const h = r.h * 0.45;
  const c = canvas(r.w, h);
  const x = c.getContext("2d");
  x.save();
  x.translate(0, r.h);
  x.scale(1, -1);
  x.drawImage(prod, 0, 0, r.w, r.h);
  x.restore();
  x.globalCompositeOperation = "destination-in";
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, r.w, h);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(c, r.x, r.bottom + 2);
  ctx.restore();
}

/** المنتج نفسه، أو الصورة الأصلية في كارت لو إزالة الخلفية ما نفعتش */
function drawProduct(ctx, prod, r, framed) {
  if (!framed) { ctx.drawImage(prod, r.x, r.y, r.w, r.h); return; }
  const rad = Math.min(r.w, r.h) * 0.06, pad = Math.min(r.w, r.h) * 0.035;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)"; ctx.shadowBlur = r.w * 0.08; ctx.shadowOffsetY = r.w * 0.03;
  ctx.fillStyle = "#fff";
  rr(ctx, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2, rad + pad);
  ctx.fill();
  ctx.restore();
  ctx.save();
  rr(ctx, r.x, r.y, r.w, r.h, rad);
  ctx.clip();
  ctx.drawImage(prod, r.x, r.y, r.w, r.h);
  ctx.restore();
}

function glow(ctx, x, y, rad, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
}

function sparkle(ctx, x, y, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
  ctx.restore();
}

function wrapLines(ctx, text, maxW, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (!line || ctx.measureText(t).width <= maxW) line = t;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

/**
 * يرسم مشهد ويرجّع كانفاس
 * @param {string} id  من SCENES أو "ai"
 * @param {object} o  { prod, framed, format, name, price, oldPrice, cta, contact, bg }
 */
export function renderScene(id, o) {
  const F = FORMATS[o.format] || FORMATS.square;
  const W = F.w, H = F.h;
  const story = H > W * 1.3;
  const c = canvas(W, H);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.direction = "rtl";
  const prod = o.prod;
  const framed = !!o.framed;
  const base = story ? H * 0.66 : H * 0.8;
  const box = { cx: W / 2, bottom: base, maxW: W * (framed ? 0.66 : 0.64), maxH: story ? H * 0.42 : H * 0.6 };

  if (id === "studio") {
    let g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.62, "#f3f4f6"); g.addColorStop(1, "#e3e6eb");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    glow(ctx, W / 2, base - box.maxH * 0.45, W * 0.55, "rgba(255,255,255,0.95)");
    const r = fit(prod, box);
    if (!framed) { softShadow(ctx, prod, r, { dy: 0.035, alpha: 0.18, blur: 0.05 }); contactShadow(ctx, r, 0.42); }
    drawProduct(ctx, prod, r, framed);
  }

  else if (id === "podium") {
    let g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#ffefe5"); g.addColorStop(1, "#ffd3bf");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // قوس خلفي
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    const aw = W * 0.62, ax = (W - aw) / 2, atop = story ? H * 0.16 : H * 0.08;
    ctx.beginPath();
    ctx.moveTo(ax, base);
    ctx.lineTo(ax, atop + aw / 2);
    ctx.arc(W / 2, atop + aw / 2, aw / 2, Math.PI, 0);
    ctx.lineTo(ax + aw, base);
    ctx.closePath(); ctx.fill();
    // البوديوم
    const pw = W * 0.6, ph = story ? H * 0.12 : H * 0.15, ry = pw * 0.12, px = (W - pw) / 2;
    g = ctx.createLinearGradient(px, 0, px + pw, 0);
    g.addColorStop(0, "#f6b296"); g.addColorStop(0.5, "#ffd0bc"); g.addColorStop(1, "#ee9f80");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(W / 2, base + ph, pw / 2, ry, 0, 0, Math.PI);
    ctx.lineTo(px, base);
    ctx.ellipse(W / 2, base, pw / 2, ry, 0, Math.PI, 0, true);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffe4d8";
    ctx.beginPath(); ctx.ellipse(W / 2, base, pw / 2, ry, 0, 0, Math.PI * 2); ctx.fill();
    // ظل البوديوم على الأرض
    ctx.save(); ctx.globalAlpha = 0.25;
    contactShadow(ctx, { cx: W / 2 + pw * 0.04, bottom: base + ph + ry * 0.8, w: pw * 1.1 }, 0.5, 0.6);
    ctx.restore();
    const r = fit(prod, { ...box, maxW: pw * 0.82, bottom: base + ry * 0.2 });
    if (!framed) contactShadow(ctx, r, 0.35, 0.5);
    drawProduct(ctx, prod, r, framed);
  }

  else if (id === "luxury") {
    let g = ctx.createRadialGradient(W / 2, base - box.maxH * 0.4, 0, W / 2, base - box.maxH * 0.4, Math.max(W, H) * 0.75);
    g.addColorStop(0, "#2e2b33"); g.addColorStop(1, "#060608");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // شعاع ضوء من فوق
    ctx.save();
    g = ctx.createLinearGradient(0, 0, 0, base);
    g.addColorStop(0, "rgba(255,236,190,0.16)"); g.addColorStop(1, "rgba(255,236,190,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(W * 0.42, 0); ctx.lineTo(W * 0.58, 0); ctx.lineTo(W * 0.82, base); ctx.lineTo(W * 0.18, base); ctx.closePath(); ctx.fill();
    ctx.restore();
    glow(ctx, W / 2, base - box.maxH * 0.42, W * 0.42, "rgba(224,182,90,0.38)");
    // الأرضية اللامعة
    g = ctx.createLinearGradient(0, base, 0, H);
    g.addColorStop(0, "#1a181d"); g.addColorStop(1, "#050506");
    ctx.fillStyle = g; ctx.fillRect(0, base, W, H - base);
    ctx.fillStyle = "rgba(224,182,90,0.55)"; ctx.fillRect(W * 0.12, base - 1, W * 0.76, 2);
    const r = fit(prod, box);
    if (!framed) { reflection(ctx, prod, r, 0.2); contactShadow(ctx, r, 0.6, 0.5); }
    drawProduct(ctx, prod, r, framed);
    for (const [x, y, s2] of [[0.18, 0.2, 14], [0.84, 0.14, 10], [0.78, 0.4, 7], [0.24, 0.46, 8]]) sparkle(ctx, W * x, H * y * (story ? 0.9 : 1), s2 * (W / 1080) * 1.4, "rgba(255,226,150,0.85)");
  }

  else if (id === "sunlight") {
    let g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#f7f0e6"); g.addColorStop(1, "#e9dccb");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // ظل الشباك
    const sh = canvas(W, H);
    const sx = sh.getContext("2d");
    sx.translate(W * 0.5, H * 0.45); sx.rotate(-0.42); sx.translate(-W * 0.5, -H * 0.45);
    sx.fillStyle = "rgba(92,62,30,1)";
    for (let i = -2; i < 6; i++) sx.fillRect(-W * 0.4 + i * W * 0.3, -H * 0.5, W * 0.11, H * 2);
    ctx.save(); ctx.globalAlpha = 0.09; ctx.drawImage(blurred(sh, 0.06), 0, 0, W, H); ctx.restore();
    glow(ctx, W * 0.72, H * 0.18, W * 0.6, "rgba(255,240,205,0.6)");
    // خط الترابيزة
    g = ctx.createLinearGradient(0, base, 0, H);
    g.addColorStop(0, "#dccbb5"); g.addColorStop(1, "#cfbaa0");
    ctx.fillStyle = g; ctx.fillRect(0, base, W, H - base);
    const r = fit(prod, box);
    if (!framed) { castShadow(ctx, prod, r, { skew: 0.95, squash: 0.32, alpha: 0.26 }); contactShadow(ctx, r, 0.4, 0.5); }
    drawProduct(ctx, prod, r, framed);
  }

  else if (id === "bold") {
    ctx.fillStyle = "#ffd21f"; ctx.fillRect(0, 0, W, H);
    const cy = base - box.maxH * 0.48, R = Math.min(W * 0.4, box.maxH * 0.62);
    ctx.fillStyle = "#1f4dff";
    ctx.beginPath(); ctx.arc(W / 2, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(5,5,16,0.9)"; ctx.lineWidth = W * 0.006;
    ctx.beginPath(); ctx.arc(W / 2, cy, R * 1.12, Math.PI * 1.1, Math.PI * 1.65); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, cy, R * 1.12, Math.PI * 0.1, Math.PI * 0.62); ctx.stroke();
    for (const [x, y, s2, col] of [[0.14, 0.18, 26, "#050510"], [0.86, 0.3, 18, "#fff"], [0.18, 0.62, 16, "#fff"], [0.82, 0.7, 24, "#050510"]]) sparkle(ctx, W * x, H * y, s2 * (W / 1080) * 1.3, col);
    const r = fit(prod, box);
    if (!framed) softShadow(ctx, prod, r, { dx: -0.05, dy: 0.04, alpha: 0.35, blur: 0.04, color: "#0a1a6b" });
    drawProduct(ctx, prod, r, framed);
  }

  else if (id === "offer") {
    let g = ctx.createRadialGradient(W / 2, H * 0.48, 0, W / 2, H * 0.48, Math.max(W, H) * 0.7);
    g.addColorStop(0, "#1b2150"); g.addColorStop(1, "#050510");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    glow(ctx, W / 2, H * 0.5, W * 0.5, "rgba(43,91,255,0.45)");
    // الاسم فوق
    const name = (o.name || "").trim();
    const top = story ? H * 0.11 : H * 0.075;
    ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = "#fff";
    let size = story ? 92 : 74;
    ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
    let lines = wrapLines(ctx, name, W * 0.84, 2);
    if (lines.length === 2 && ctx.measureText(lines[1]).width > W * 0.84) { size *= 0.85; ctx.font = `900 ${size}px ${DISPLAY_FONT}`; lines = wrapLines(ctx, name, W * 0.84, 2); }
    lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * size * 1.22));
    const textBottom = top + Math.max(1, lines.length) * size * 1.22;
    // المنتج
    const ctaH = story ? H * 0.1 : H * 0.12;
    const pBottom = H - ctaH - (story ? H * 0.1 : H * 0.07);
    const r = fit(prod, { cx: W / 2, bottom: pBottom, maxW: W * 0.66, maxH: pBottom - textBottom - H * 0.05 });
    if (!framed) { softShadow(ctx, prod, r, { dy: 0.03, alpha: 0.5, blur: 0.05 }); contactShadow(ctx, r, 0.6, 0.5); }
    drawProduct(ctx, prod, r, framed);
    // السعر
    const price = (o.price || "").trim();
    if (price) {
      const pr = story ? 150 : 128;
      const px = Math.min(W - pr - 30, r.x + r.w + pr * 0.15), py = Math.max(textBottom + pr * 0.9, r.y + pr * 0.4);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 30;
      ctx.fillStyle = "#ffd21f";
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#050510"; ctx.textBaseline = "middle";
      let ps = pr * 0.62;
      ctx.font = `900 ${ps}px ${DISPLAY_FONT}`;
      while (ctx.measureText(price).width > pr * 1.65 && ps > 20) { ps -= 4; ctx.font = `900 ${ps}px ${DISPLAY_FONT}`; }
      const old = (o.oldPrice || "").trim();
      ctx.fillText(price, px, py + (old ? pr * 0.12 : 0));
      if (old) {
        ctx.font = `700 ${pr * 0.26}px ${UI_FONT}`;
        ctx.fillStyle = "rgba(5,5,16,0.6)";
        const oy = py - pr * 0.42;
        ctx.fillText(old, px, oy);
        const ow = ctx.measureText(old).width;
        ctx.fillRect(px - ow / 2 - 4, oy, ow + 8, pr * 0.03);
      }
    }
    // شريط الطلب
    const cta = (o.cta || "اطلب دلوقتي").trim();
    const contact = (o.contact || "").trim();
    const by = H - ctaH - (story ? H * 0.06 : H * 0.045);
    ctx.fillStyle = "#ffd21f";
    rr(ctx, W * 0.08, by, W * 0.84, ctaH, ctaH / 2); ctx.fill();
    ctx.fillStyle = "#050510"; ctx.textBaseline = "middle";
    const label = contact ? `${cta} · ${contact}` : cta;
    let cs = ctaH * 0.36;
    ctx.font = `800 ${cs}px ${DISPLAY_FONT}`;
    while (ctx.measureText(label).width > W * 0.76 && cs > 18) { cs -= 2; ctx.font = `800 ${cs}px ${DISPLAY_FONT}`; }
    ctx.fillText(label, W / 2, by + ctaH / 2 + 2);
  }

  else if (id === "ai" && o.bg) {
    const bg = o.bg;
    const k = Math.max(W / bg.width, H / bg.height);
    ctx.drawImage(bg, (W - bg.width * k) / 2, (H - bg.height * k) / 2, bg.width * k, bg.height * k);
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = fit(prod, { ...box, bottom: story ? H * 0.72 : H * 0.84 });
    if (!framed) { softShadow(ctx, prod, r, { dx: 0.03, dy: 0.03, alpha: 0.3, blur: 0.05 }); contactShadow(ctx, r, 0.5, 0.52); }
    drawProduct(ctx, prod, r, framed);
  }

  return c;
}
