"use client";
// رسم كروت المشاركة (ستوري 1080×1920) على الكانفاس بهوية الموقع: سما ليل، نجمة صفرا، وخط إسكندرية.
import { STAR_PATH } from "@/components/StarMark";
import { DISPLAY_FONT, UI_FONT, WORD_FONT } from "@/lib/imagefile";

export const STORY = { w: 1080, h: 1920 };

export function storyCanvas() {
  const c = document.createElement("canvas");
  c.width = STORY.w; c.height = STORY.h;
  const ctx = c.getContext("2d");
  ctx.direction = "rtl";
  return { c, ctx };
}

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** خلفية الليل بالنجوم والتوهج */
export function night(ctx, W, H, { glow = "rgba(43,91,255,0.55)", glow2 = "rgba(255,196,0,0.28)" } = {}) {
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, W, H);
  let g = ctx.createRadialGradient(W / 2, H * 1.05, 0, W / 2, H * 1.05, H * 0.75);
  g.addColorStop(0, glow); g.addColorStop(1, "rgba(5,5,16,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(W * 0.5, H * 0.12, 0, W * 0.5, H * 0.12, W * 0.6);
  g.addColorStop(0, glow2); g.addColorStop(1, "rgba(5,5,16,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // نجوم ثابتة (نفس الأماكن كل مرة)
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 90; i++) {
    const x = rnd() * W, y = rnd() * H * 0.7, r = 0.6 + rnd() * 1.8;
    ctx.globalAlpha = 0.25 + rnd() * 0.6;
    ctx.fillStyle = i % 11 === 0 ? "#ffd21f" : "#fff";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** نجمة الموقع */
export function star(ctx, cx, cy, size) {
  const p = new Path2D(STAR_PATH);
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  const g = ctx.createLinearGradient(4, 0, 20, 24);
  g.addColorStop(0, "#FFE680"); g.addColorStop(0.45, "#FFC61A"); g.addColorStop(1, "#F59E0B");
  ctx.shadowColor = "rgba(255,190,0,0.75)"; ctx.shadowBlur = 40 / (size / 24);
  ctx.fillStyle = g; ctx.strokeStyle = g; ctx.lineWidth = 1.7; ctx.lineJoin = "round";
  ctx.fill(p); ctx.stroke(p);
  ctx.restore();
}

/** تقسيم الكلام لسطور على قد العرض */
export function wrap(ctx, text, maxW, maxLines = 99) {
  const out = [];
  for (const para of String(text).split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width <= maxW || !line) line = t;
      else { out.push(line); line = w; }
    }
    if (line) out.push(line);
  }
  if (out.length > maxLines) {
    const cut = out.slice(0, maxLines);
    cut[maxLines - 1] = cut[maxLines - 1].replace(/\s+\S*$/, "") + "…";
    return cut;
  }
  return out;
}

export function text(ctx, str, x, y, { size = 40, weight = 600, color = "#fff", align = "center", font = "ui", maxW } = {}) {
  ctx.font = `${weight} ${size}px ${font === "display" ? DISPLAY_FONT : font === "word" ? WORD_FONT : UI_FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  if (maxW) ctx.fillText(str, x, y, maxW); else ctx.fillText(str, x, y);
}

/** اسم الموقع ورابطه تحت الكارت */
export function brandFooter(ctx, W, H, path = "") {
  const host = (typeof location !== "undefined" ? location.host : "risingstar.ai").replace(/^www\./, "");
  star(ctx, W / 2, H - 196, 58);
  ctx.save();
  ctx.direction = "ltr";
  ctx.font = `900 64px ${WORD_FONT}`;
  ctx.textAlign = "center";
  const a = "Rising Star", b = "Ai";
  const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
  const x0 = W / 2 - (wa + wb) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff"; ctx.fillText(a, x0, H - 104);
  ctx.fillStyle = "#4a74ff"; ctx.fillText(b, x0 + wa, H - 104);
  ctx.font = `600 34px ${UI_FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "center";
  ctx.fillText(`${host}${path}`, W / 2, H - 52);
  ctx.restore();
}

export function toBlob(c, type = "image/png", q) {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("ما قدرناش نعمل الصورة."))), type, q));
}
