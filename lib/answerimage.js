"use client";
// «صورة للإجابة»: بيرسم السؤال والرد في صورة PNG مرتبة (زي سكرين شوت نضيف) عشان العميل يحفظها أو يشاركها.
// الرسم على canvas مباشرة بالعربي (من اليمين للشمال)، فمش محتاج أي مكتبة.

const W = 1080;
const PAD = 72;
const FONT = '"IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif';

/** Markdown ← سطور بسيطة: { kind: h|li|p|gap, text } */
function toBlocks(md) {
  const out = [];
  const clean = (t) => t
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .replace(/^\s*>\s?/, "")
    .trim();
  for (const raw of String(md || "").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) { if (out.length && out[out.length - 1].kind !== "gap") out.push({ kind: "gap" }); continue; }
    if (/^\s*\|?\s*:?-{3,}/.test(line)) continue; // فاصل جدول
    if (/^#{1,4}\s/.test(line)) out.push({ kind: "h", text: clean(line.replace(/^#{1,4}\s+/, "")) });
    else if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) out.push({ kind: "li", text: clean(line.replace(/^\s*([-*•]|\d+[.)])\s+/, "")) });
    else if (line.includes("|")) out.push({ kind: "p", text: clean(line.split("|").map((c) => c.trim()).filter(Boolean).join(" — ")) });
    else out.push({ kind: "p", text: clean(line) });
  }
  return out.filter((b) => b.kind === "gap" || b.text);
}

function wrap(ctx, text, max) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > max && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

const STYLE = {
  q: { size: 38, weight: 600, color: "#0b0b14", lh: 1.6 },
  h: { size: 36, weight: 700, color: "#0b0b14", lh: 1.6 },
  p: { size: 32, weight: 400, color: "#1f2430", lh: 1.75 },
  li: { size: 32, weight: 400, color: "#1f2430", lh: 1.75 },
};

/** بيرجّع Blob لصورة PNG */
export async function answerToPng({ question, answer, brand = "Rising StarAi", site = "rising-star-ai.vercel.app" }) {
  try { await Promise.all([document.fonts.load(`400 32px ${FONT}`), document.fonts.load(`700 36px ${FONT}`)]); } catch {}
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const inner = W - PAD * 2 - 48;
  const blocks = toBlocks(answer);

  // أول مرة بنحسب الطول، وتاني مرة بنرسم
  const layout = () => {
    const rows = [];
    let y = 0;
    const push = (kind, text, indent = 0) => {
      const st = STYLE[kind];
      ctx.font = `${st.weight} ${st.size}px ${FONT}`;
      for (const [k, line] of wrap(ctx, text, inner - indent).entries()) {
        y += st.size * st.lh;
        rows.push({ kind, line, y, indent, bullet: kind === "li" && k === 0 });
      }
    };
    push("q", question.slice(0, 400));
    y += 34;
    rows.push({ kind: "rule", y });
    y += 18;
    for (const b of blocks) {
      if (b.kind === "gap") { y += 14; continue; }
      if (b.kind === "h") y += 16;
      push(b.kind, b.text, b.kind === "li" ? 40 : 0);
      if (y > 7000) { rows.push({ kind: "p", line: "…", y: (y += 50), indent: 0 }); break; }
    }
    return { rows, height: y };
  };

  ctx.font = `400 32px ${FONT}`;
  const { rows, height } = layout();
  const headH = 120;
  const H = Math.ceil(PAD + headH + height + 70 + 90 + PAD);
  canvas.width = W;
  canvas.height = H;

  // الخلفية والكارت
  ctx.fillStyle = "#f1f7f3";
  ctx.fillRect(0, 0, W, H);
  const cardX = PAD - 24, cardY = PAD + headH - 20, cardW = W - (PAD - 24) * 2, cardH = height + 90;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 36);
  ctx.fill();

  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  const right = W - PAD;

  // الهيدر: اسم الموقع ونجمة
  ctx.fillStyle = "#0b0b14";
  ctx.font = `700 44px ${FONT}`;
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.fillText(brand, PAD, PAD + 56);
  ctx.fillStyle = "#ffc61a";
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText("★", PAD + ctx.measureText(`${brand} `).width + 4, PAD + 56);
  ctx.direction = "rtl";
  ctx.textAlign = "right";

  const top = cardY + 24;
  for (const r of rows) {
    if (r.kind === "rule") {
      ctx.fillStyle = "rgba(17,24,39,0.08)";
      ctx.fillRect(PAD, top + r.y, W - PAD * 2, 2);
      continue;
    }
    const st = STYLE[r.kind];
    ctx.font = `${st.weight} ${st.size}px ${FONT}`;
    ctx.fillStyle = st.color;
    ctx.fillText(r.line, right - 24 - r.indent, top + r.y);
    if (r.bullet) {
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.arc(right - 24 - 14, top + r.y - st.size * 0.32, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // الفوتر
  ctx.fillStyle = "#5b6474";
  ctx.font = `400 26px ${FONT}`;
  ctx.direction = "ltr";
  ctx.textAlign = "center";
  ctx.fillText(site, W / 2, H - PAD + 10);

  return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
}

/** مشاركة الصورة (الموبايل) أو تنزيلها */
export async function shareOrDownload(blob, name = "rising-star-answer.png") {
  const file = new File([blob], name, { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "إجابة من Rising StarAi" });
      return "shared";
    }
  } catch (e) {
    if (e?.name === "AbortError") return "cancel";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
