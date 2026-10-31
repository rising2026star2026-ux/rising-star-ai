"use client";
// رسم صفحات الكتالوج على الكانفاس (عشان العربي يطلع مظبوط في الـ PDF والصور)، وبيرجّع أماكن زراير الطلب
// عشان تتحول لينكات واتساب جوه الـ PDF.
import { DISPLAY_FONT, UI_FONT, WORD_FONT } from "@/lib/imagefile";

export const THEMES = {
  night: { name: "ليل ذهبي", bg: "#050510", bg2: "#161a3a", card: "#10132b", text: "#ffffff", muted: "rgba(255,255,255,0.68)", accent: "#ffd21f", onAccent: "#050510", price: "#ffd21f", imgBg: "#ffffff" },
  white: { name: "أبيض أنيق", bg: "#f4f5f8", bg2: "#ffffff", card: "#ffffff", text: "#0b0b14", muted: "#5b6474", accent: "#1f4dff", onAccent: "#ffffff", price: "#0b0b14", imgBg: "#f6f7f9" },
  pastel: { name: "باستيل", bg: "#fff3ea", bg2: "#ffe3d3", card: "#ffffff", text: "#3b2a22", muted: "#8a6f62", accent: "#e8735a", onAccent: "#ffffff", price: "#c2410c", imgBg: "#fff8f3" },
  bold: { name: "جريء", bg: "#ffd21f", bg2: "#ffbf00", card: "#ffffff", text: "#050510", muted: "#4a5063", accent: "#1f4dff", onAccent: "#ffffff", price: "#1f4dff", imgBg: "#ffffff" },
};

export const LAYOUTS = {
  phone: { name: "للموبايل والواتساب", w: 1080, h: 1920, cols: 2, rows: 2, pt: [405, 720] },
  a4: { name: "A4 للطباعة", w: 1240, h: 1754, cols: 2, rows: 3, pt: [595.28, 841.89] },
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function font(ctx, w, size, fam = "ui") { ctx.font = `${w} ${size}px ${fam === "display" ? DISPLAY_FONT : fam === "word" ? WORD_FONT : UI_FONT}`; }
function lines(ctx, text, maxW, max) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const out = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (!line || ctx.measureText(t).width <= maxW) line = t;
    else { out.push(line); line = w; }
  }
  if (line) out.push(line);
  if (out.length > max) { const cut = out.slice(0, max); cut[max - 1] = cut[max - 1].replace(/\s*\S+$/, "") + "…"; return cut; }
  return out;
}
function fitText(ctx, str, maxW, weight, size, fam, min = 18) {
  let s = size;
  font(ctx, weight, s, fam);
  while (ctx.measureText(str).width > maxW && s > min) { s -= 2; font(ctx, weight, s, fam); }
  return s;
}
function background(ctx, W, H, T) {
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, T.bg); g.addColorStop(1, T.bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function drawContain(ctx, img, x, y, w, h) {
  const k = Math.min(w / img.width, h / img.height);
  const dw = img.width * k, dh = img.height * k;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
export const waLink = (phone, text) => {
  const digits = String(phone || "").replace(/\D/g, "");
  const intl = digits.startsWith("0") && digits.length === 11 ? `2${digits}` : digits; // رقم مصري 01xxxxxxxxx ← 201xxxxxxxxx
  return intl ? `https://wa.me/${intl}?text=${encodeURIComponent(text)}` : "";
};

function footer(ctx, W, H, T, shop, page, total, fh) {
  const y = H - fh;
  ctx.fillStyle = T.text === "#ffffff" ? "rgba(255,255,255,0.06)" : "rgba(5,5,16,0.05)";
  ctx.fillRect(0, y, W, fh);
  ctx.direction = "rtl"; ctx.textBaseline = "middle";
  font(ctx, 700, Math.round(fh * 0.3), "display");
  ctx.fillStyle = T.text; ctx.textAlign = "right";
  ctx.fillText(shop.phone ? `للطلب واتساب: ${shop.phone}` : shop.name || "", W - 50, y + fh * 0.4);
  font(ctx, 500, Math.round(fh * 0.2));
  ctx.fillStyle = T.muted;
  ctx.fillText("اتعمل في دقيقة على Rising StarAi", W - 50, y + fh * 0.76);
  ctx.textAlign = "left";
  font(ctx, 800, Math.round(fh * 0.28), "word");
  ctx.direction = "ltr";
  ctx.fillText(`${page} / ${total}`, 50, y + fh * 0.5);
  ctx.direction = "rtl";
}

/** الغلاف */
export function renderCover(o) {
  const L = LAYOUTS[o.layout] || LAYOUTS.phone, T = THEMES[o.theme] || THEMES.night;
  const { w: W, h: H } = L;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.direction = "rtl";
  background(ctx, W, H, T);
  const links = [];
  // دواير زخرفة
  ctx.fillStyle = T.accent; ctx.globalAlpha = 0.12;
  ctx.beginPath(); ctx.arc(W * 0.92, H * 0.08, W * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.05, H * 0.62, W * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  const portrait = H / W > 1.6;
  let y = H * (portrait ? 0.09 : 0.07);
  if (o.logo) {
    const R = W * 0.1;
    ctx.save(); ctx.beginPath(); ctx.arc(W / 2, y + R, R, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.clip();
    drawContain(ctx, o.logo, W / 2 - R * 0.8, y + R * 0.2, R * 1.6, R * 1.6);
    ctx.restore();
    y += R * 2 + H * 0.03;
  }
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = T.text;
  const nameSize = fitText(ctx, o.shop.name || "متجري", W * 0.86, 900, Math.round(W * 0.11), "display", 40);
  y += nameSize;
  ctx.fillText(o.shop.name || "متجري", W / 2, y);
  if (o.shop.tagline) {
    font(ctx, 600, Math.round(W * 0.04));
    ctx.fillStyle = T.muted;
    const tl = lines(ctx, o.shop.tagline, W * 0.8, 2);
    tl.forEach((l, i) => ctx.fillText(l, W / 2, y + W * 0.075 + i * W * 0.055));
    y += W * 0.075 + (tl.length - 1) * W * 0.055;
  }
  // كولاج المنتجات في نص الصفحة
  const bottomBlock = H * (portrait ? 0.27 : 0.25);
  const avail = H - y - bottomBlock - H * 0.04;
  const cs = Math.min(W * 0.37, avail * 0.8);
  const cy = y + H * 0.03 + avail / 2;
  const imgs = o.products.map((p) => p.image).filter(Boolean).slice(0, 3);
  const pos = imgs.length === 1 ? [[0, 0, 0]] : imgs.length === 2 ? [[-0.42, 0, -0.08], [0.42, 0, 0.08]] : [[-0.6, 0.08, -0.11], [0.6, 0.08, 0.11], [0, -0.06, 0]];
  imgs.forEach((im, i) => {
    const [dx, dy, rot] = pos[i];
    ctx.save();
    ctx.translate(W / 2 + dx * cs, cy + dy * cs);
    ctx.rotate(rot);
    ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
    ctx.fillStyle = T.imgBg; rr(ctx, -cs / 2, -cs / 2, cs, cs, cs * 0.08); ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.save(); rr(ctx, -cs / 2, -cs / 2, cs, cs, cs * 0.08); ctx.clip();
    drawContain(ctx, im, -cs / 2 + cs * 0.06, -cs / 2 + cs * 0.06, cs * 0.88, cs * 0.88);
    ctx.restore();
    ctx.restore();
  });
  // عدد المنتجات والتاريخ وزرار واتساب تحت
  y = H - bottomBlock;
  ctx.fillStyle = T.text; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  font(ctx, 800, Math.round(W * 0.048), "display");
  const month = new Date().toLocaleDateString("ar-EG-u-nu-latn", { month: "long", year: "numeric" });
  ctx.fillText(`كتالوج ${month} · ${o.products.length} منتج`, W / 2, y + W * 0.03);
  if (o.shop.phone) {
    const bw = W * 0.76, bh = W * 0.13, bx = (W - bw) / 2, by = y + W * 0.08;
    ctx.fillStyle = "#25d366"; rr(ctx, bx, by, bw, bh, bh / 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textBaseline = "middle";
    fitText(ctx, `اطلب على واتساب ${o.shop.phone}`, bw * 0.86, 800, Math.round(bh * 0.34), "display");
    ctx.fillText(`اطلب على واتساب ${o.shop.phone}`, W / 2, by + bh / 2 + 2);
    links.push({ x: bx, y: by, w: bw, h: bh, url: waLink(o.shop.phone, `أهلاً ${o.shop.name || ""}، شفت الكتالوج وعايز أطلب`) });
  }
  ctx.textBaseline = "alphabetic"; ctx.fillStyle = T.muted;
  font(ctx, 600, Math.round(W * 0.026));
  ctx.fillText("اتعمل في دقيقة على Rising StarAi", W / 2, H - H * 0.025);
  return { canvas: c, links };
}

/** صفحة منتجات */
export function renderProducts(o, pageProducts, startIndex, page, total) {
  const L = LAYOUTS[o.layout] || LAYOUTS.phone, T = THEMES[o.theme] || THEMES.night;
  const { w: W, h: H, cols, rows } = L;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.direction = "rtl";
  background(ctx, W, H, T);
  const links = [];
  const hh = Math.round(H * 0.07), fh = Math.round(H * 0.06), m = Math.round(W * 0.045), gap = Math.round(W * 0.032);
  // رأس الصفحة
  ctx.textBaseline = "middle"; ctx.textAlign = "right"; ctx.fillStyle = T.text;
  fitText(ctx, o.shop.name || "متجري", W * 0.6, 900, Math.round(hh * 0.42), "display");
  ctx.fillText(o.shop.name || "متجري", W - m, hh * 0.58);
  const pillW = W * 0.27;
  ctx.fillStyle = T.accent; rr(ctx, m, hh * 0.3, pillW, hh * 0.54, hh * 0.27); ctx.fill();
  ctx.fillStyle = T.onAccent; ctx.textAlign = "center";
  fitText(ctx, "اطلب برقم المنتج", pillW * 0.86, 800, Math.round(hh * 0.26), "display", 12);
  ctx.fillText("اطلب برقم المنتج", m + pillW / 2, hh * 0.58);

  const tw = (W - m * 2 - gap * (cols - 1)) / cols;
  const th = (H - hh - fh - m - gap * (rows - 1)) / rows;
  pageProducts.forEach((p, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = W - m - (col + 1) * tw - col * gap; // من اليمين لليسار
    const y = hh + row * (th + gap);
    const r = Math.min(tw, th) * 0.06;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.12)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = T.card; rr(ctx, x, y, tw, th, r); ctx.fill();
    ctx.restore();
    const pad = tw * 0.06;
    const textH = Math.min(th * 0.42, Math.max(tw * 0.5, th * 0.3));
    const ih = th - textH - pad;
    ctx.save(); rr(ctx, x + pad, y + pad, tw - pad * 2, ih, r * 0.8); ctx.clip();
    ctx.fillStyle = T.imgBg; ctx.fillRect(x + pad, y + pad, tw - pad * 2, ih);
    if (p.image) drawContain(ctx, p.image, x + pad * 1.6, y + pad * 1.6, tw - pad * 3.2, ih - pad * 1.2);
    ctx.restore();
    // رقم المنتج
    const num = startIndex + i + 1;
    const nb = tw * 0.13;
    ctx.fillStyle = T.accent; ctx.beginPath(); ctx.arc(x + tw - pad - nb * 0.55, y + pad + nb * 0.55, nb * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = T.onAccent; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    font(ctx, 900, Math.round(nb * 0.5), "word");
    ctx.fillText(String(num), x + tw - pad - nb * 0.55, y + pad + nb * 0.58);
    // الاسم والوصف
    let ty = y + pad + ih + tw * 0.07;
    ctx.textAlign = "right"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = T.text;
    const ns = Math.round(tw * 0.078);
    font(ctx, 800, ns, "display");
    const nl = lines(ctx, p.name || `منتج ${num}`, tw - pad * 2, 2);
    nl.forEach((l, k) => ctx.fillText(l, x + tw - pad, ty + k * ns * 1.3));
    ty += nl.length * ns * 1.3;
    if (p.desc) {
      const ds = Math.round(tw * 0.056);
      font(ctx, 500, ds);
      ctx.fillStyle = T.muted;
      const dl = lines(ctx, p.desc, tw - pad * 2, nl.length > 1 ? 1 : 2);
      dl.forEach((l, k) => ctx.fillText(l, x + tw - pad, ty + k * ds * 1.4 - ds * 0.1));
    }
    // السعر وزرار الطلب
    const py = y + th - pad - tw * 0.02;
    if (p.price) {
      ctx.fillStyle = T.price; ctx.textAlign = "right";
      const ps = Math.round(tw * 0.098);
      font(ctx, 900, ps, "display");
      ctx.fillText(p.price, x + tw - pad, py);
      if (p.oldPrice) {
        const pw = ctx.measureText(p.price).width;
        font(ctx, 600, Math.round(ps * 0.5));
        ctx.fillStyle = T.muted;
        const ox = x + tw - pad - pw - tw * 0.04;
        ctx.fillText(p.oldPrice, ox, py - ps * 0.12);
        const ow = ctx.measureText(p.oldPrice).width;
        ctx.fillRect(ox - ow, py - ps * 0.3, ow, Math.max(2, ps * 0.05));
      }
    }
    if (o.shop.phone) {
      const bw = tw * 0.3, bh = tw * 0.115, bx = x + pad, by = py - bh * 0.8;
      ctx.fillStyle = "#25d366"; rr(ctx, bx, by, bw, bh, bh / 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      font(ctx, 800, Math.round(bh * 0.46), "display");
      ctx.fillText("اطلب", bx + bw / 2, by + bh / 2 + 1);
      links.push({ x, y, w: tw, h: th, url: waLink(o.shop.phone, `عايز أطلب منتج رقم ${num}: ${p.name || ""}${p.price ? ` (${p.price})` : ""}`) });
    }
  });
  footer(ctx, W, H, T, o.shop, page, total, fh);
  return { canvas: c, links };
}

/** آخر صفحة: إزاي تطلب + QR */
export function renderHowTo(o, qr) {
  const L = LAYOUTS[o.layout] || LAYOUTS.phone, T = THEMES[o.theme] || THEMES.night;
  const { w: W, h: H } = L;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.direction = "rtl";
  background(ctx, W, H, T);
  const links = [];
  ctx.textAlign = "center"; ctx.fillStyle = T.text; ctx.textBaseline = "alphabetic";
  font(ctx, 900, Math.round(W * 0.085), "display");
  let y = H * (H / W > 1.6 ? 0.16 : 0.12);
  ctx.fillText("إزاي تطلب؟", W / 2, y);
  const steps = ["اختار المنتج اللي عاجبك", "ابعتلنا رقمه على واتساب", "بنأكد معاك الطلب ونشحنهولك"];
  y += W * 0.1;
  steps.forEach((st, i) => {
    const bh = W * 0.13, bx = W * 0.1, bw = W * 0.8;
    ctx.fillStyle = T.card; rr(ctx, bx, y, bw, bh, bh * 0.3); ctx.fill();
    ctx.fillStyle = T.accent; ctx.beginPath(); ctx.arc(bx + bw - bh * 0.5, y + bh / 2, bh * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = T.onAccent; ctx.textBaseline = "middle";
    font(ctx, 900, Math.round(bh * 0.32), "word");
    ctx.fillText(String(i + 1), bx + bw - bh * 0.5, y + bh / 2 + 2);
    ctx.fillStyle = T.card === "#ffffff" ? "#0b0b14" : "#ffffff"; ctx.textAlign = "right";
    fitText(ctx, st, bw - bh * 1.3, 700, Math.round(bh * 0.28), "display");
    ctx.fillText(st, bx + bw - bh, y + bh / 2 + 2);
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    y += bh + W * 0.03;
  });
  y += W * 0.05;
  if (!qr && o.shop.phone) {
    const bw = W * 0.76, bh = W * 0.14, bx = (W - bw) / 2;
    y += W * 0.04;
    ctx.fillStyle = "#25d366"; rr(ctx, bx, y, bw, bh, bh / 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textBaseline = "middle";
    fitText(ctx, "كلمنا على واتساب", bw * 0.8, 900, Math.round(bh * 0.36), "display");
    ctx.fillText("كلمنا على واتساب", W / 2, y + bh / 2 + 2);
    ctx.textBaseline = "alphabetic";
    links.push({ x: bx, y, w: bw, h: bh, url: waLink(o.shop.phone, `أهلاً ${o.shop.name || ""}، عايز أطلب من الكتالوج`) });
    y += bh + W * 0.09;
  }
  if (qr && o.shop.phone) {
    const qs = Math.min(W * 0.46, H - y - H * 0.22);
    const qx = (W - qs) / 2;
    ctx.fillStyle = "#fff"; rr(ctx, qx - qs * 0.06, y - qs * 0.06, qs * 1.12, qs * 1.12, qs * 0.06); ctx.fill();
    const n = qr.getModuleCount(), cell = qs / n;
    ctx.fillStyle = "#050510";
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) ctx.fillRect(qx + k * cell, y + r * cell, Math.ceil(cell), Math.ceil(cell));
    links.push({ x: qx, y, w: qs, h: qs, url: waLink(o.shop.phone, `أهلاً ${o.shop.name || ""}، عايز أطلب من الكتالوج`) });
    y += qs + qs * 0.2;
    ctx.fillStyle = T.text; font(ctx, 700, Math.round(W * 0.036));
    ctx.fillText("صوّر الكود بالموبايل وكلمنا واتساب على طول", W / 2, y);
    y += W * 0.06;
  }
  if (o.shop.phone) {
    ctx.fillStyle = T.text; font(ctx, 900, Math.round(W * 0.07), "word");
    ctx.direction = "ltr"; ctx.fillText(o.shop.phone, W / 2, y + W * 0.04); ctx.direction = "rtl";
  }
  // توقيع الموقع
  ctx.fillStyle = T.muted; font(ctx, 600, Math.round(W * 0.028));
  ctx.fillText("الكتالوج ده اتعمل في دقيقة على Rising StarAi", W / 2, H - H * 0.05);
  const host = typeof location !== "undefined" ? location.host : "";
  font(ctx, 700, Math.round(W * 0.026), "word");
  ctx.direction = "ltr"; ctx.fillText(`${host}/catalog`, W / 2, H - H * 0.025); ctx.direction = "rtl";
  links.push({ x: 0, y: H - H * 0.08, w: W, h: H * 0.08, url: `${typeof location !== "undefined" ? location.origin : ""}/catalog` });
  return { canvas: c, links };
}

/** كل صفحات الكتالوج */
export function renderCatalog(o, qr) {
  const L = LAYOUTS[o.layout] || LAYOUTS.phone;
  const per = L.cols * L.rows;
  const chunks = [];
  for (let i = 0; i < o.products.length; i += per) chunks.push(o.products.slice(i, i + per));
  const total = chunks.length + 2;
  const pages = [renderCover(o)];
  chunks.forEach((ch, i) => pages.push(renderProducts(o, ch, i * per, i + 2, total)));
  pages.push(renderHowTo(o, qr));
  return pages;
}
