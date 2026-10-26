"use client";
// مصمم البوستات: بديل سريع لكانفا. مقاس، قالب ألوان، كلامك، وتحميل.
import { useEffect, useRef, useState } from "react";
import { Drop, Range, Seg, ColorField, TextField, Workbench, Note, Busy, styles as s } from "./ui";
import { IMAGE_TYPES, loadImage, makeCanvas, canvasToBlob, download, siteFont, ensureFont, wrapLines } from "./util";
import { toast } from "@/lib/store";

const SIZES = [
  { id: "post", label: "بوست مربع", w: 1080, h: 1080 },
  { id: "portrait", label: "بوست طولي", w: 1080, h: 1350 },
  { id: "story", label: "ستوري", w: 1080, h: 1920 },
  { id: "wide", label: "فيسبوك ولينكدإن", w: 1200, h: 630 },
  { id: "thumb", label: "صورة يوتيوب", w: 1280, h: 720 },
];

const THEMES = [
  { name: "ذهبي فاخر", c1: "#0d0b08", c2: "#2b2210", text: "#f3e7c8", accent: "#cfa94d", onAccent: "#14120b" },
  { name: "أزرق ملكي", c1: "#081233", c2: "#2546a8", text: "#ffffff", accent: "#ffd166", onAccent: "#1a1300" },
  { name: "وردي ناعم", c1: "#ffe3ee", c2: "#ffc2d8", text: "#4a1630", accent: "#d94f8a", onAccent: "#ffffff" },
  { name: "أخضر طبيعي", c1: "#0d3628", c2: "#1f7a55", text: "#f2fff8", accent: "#b8f5d0", onAccent: "#0d3628" },
  { name: "أبيض بسيط", c1: "#ffffff", c2: "#eeeeee", text: "#151515", accent: "#151515", onAccent: "#ffffff" },
  { name: "أسود جريء", c1: "#000000", c2: "#1c1c1c", text: "#ffffff", accent: "#ff4d4d", onAccent: "#ffffff" },
  { name: "غروب", c1: "#ff6a4d", c2: "#ffb347", text: "#ffffff", accent: "#3a1607", onAccent: "#ffe9d6" },
  { name: "بنفسجي", c1: "#1b0f3b", c2: "#6a3fd1", text: "#ffffff", accent: "#7ef0d2", onAccent: "#10062a" },
];

export default function Poster() {
  const [size, setSize] = useState("portrait");
  const [theme, setTheme] = useState(THEMES[0]);
  const [bgType, setBgType] = useState("gradient");
  const [bgImg, setBgImg] = useState(null);
  const [shade, setShade] = useState(45);
  const [logo, setLogo] = useState(null);
  const [badge, setBadge] = useState("عرض خاص");
  const [title, setTitle] = useState("خصم 30% على كل المنيو");
  const [sub, setSub] = useState("العرض ساري لحد آخر الشهر، والتوصيل على حسابنا للطلبات فوق 300 جنيه");
  const [foot, setFoot] = useState("اطلب دلوقتي من الرابط في البايو");
  const [align, setAlign] = useState("right");
  const [vpos, setVpos] = useState("center");
  const [scale, setScale] = useState(100);
  const [frame, setFrame] = useState(true);
  const [format, setFormat] = useState("png");
  const [busy, setBusy] = useState(false);
  const [fontReady, setFontReady] = useState(false);
  const view = useRef(null);

  useEffect(() => {
    let live = true;
    Promise.all([ensureFont(600), ensureFont(400)]).then(() => live && setFontReady(true));
    return () => { live = false; };
  }, []);

  const opts = { size, theme, bgType, bgImg, shade, logo, badge, title, sub, foot, align, vpos, scale, frame };

  useEffect(() => {
    if (!view.current) return;
    drawPoster(view.current, opts);
  }); // بيترسم مع كل تغيير، والرسم نفسه سريع

  async function openBg(files) {
    try { setBgImg(await loadImage(files[0])); setBgType("image"); } catch (e) { toast(e.message); }
  }
  async function openLogo(files) {
    try { setLogo(await loadImage(files[0])); } catch (e) { toast(e.message); }
  }

  async function save() {
    setBusy(true);
    try {
      const c = makeCanvas(1, 1);
      drawPoster(c, opts);
      const blob = await canvasToBlob(c, format, 0.93);
      const p = SIZES.find((x) => x.id === size);
      download(blob, `rising-star-${p.id}-${p.w}x${p.h}.${format}`);
      toast("التصميم اتحمل");
    } catch (e) { toast(e.message); } finally { setBusy(false); }
  }

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <span className={s.badge}><i />بيشتغل على جهازك، ومن غير علامة مائية</span>
        {!fontReady && <span className={s.meta}>بيحمّل الخط...</span>}
      </div>
      <Workbench
        preview={<canvas ref={view} aria-label="معاينة التصميم" />}
        controls={
          <>
            <div className={s.section}>
              <span className={s.sectionTitle}>المقاس</span>
              <div className={s.presets}>
                {SIZES.map((p) => (
                  <button key={p.id} type="button" className={`${s.preset} ${size === p.id ? s.presetOn : ""}`} onClick={() => setSize(p.id)}>
                    {p.label}<small>{p.w}×{p.h}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className={s.section}>
              <span className={s.sectionTitle}>القالب</span>
              <div className={s.presets}>
                {THEMES.map((t) => (
                  <button key={t.name} type="button" className={`${s.preset} ${theme.name === t.name ? s.presetOn : ""}`} onClick={() => setTheme(t)}>
                    <span className={s.swatchDot} style={{ background: `linear-gradient(135deg, ${t.c1}, ${t.c2})`, boxShadow: `inset -10px 0 0 ${t.accent}` }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={s.section}>
              <span className={s.sectionTitle}>الكلام</span>
              <TextField label="شارة صغيرة فوق" value={badge} onChange={setBadge} placeholder="عرض خاص، جديد، ..." maxLength={40} />
              <TextField label="العنوان" value={title} onChange={setTitle} multiline maxLength={120} />
              <TextField label="السطر الفرعي" value={sub} onChange={setSub} multiline maxLength={220} />
              <TextField label="تحت خالص" value={foot} onChange={setFoot} placeholder="رقمك، حسابك، أو موقعك" maxLength={80} />
            </div>

            <div className={s.section}>
              <span className={s.sectionTitle}>الترتيب</span>
              <Seg value={align} options={[["right", "يمين"], ["center", "نص"], ["left", "شمال"]]} onChange={setAlign} />
              <Seg value={vpos} options={[["top", "فوق"], ["center", "في النص"], ["bottom", "تحت"]]} onChange={setVpos} />
              <Range label="حجم العنوان" value={scale} min={60} max={150} unit="%" onChange={setScale} />
              <label className={s.colorField}>
                <span>إطار رفيع</span>
                <input type="checkbox" checked={frame} onChange={(e) => setFrame(e.target.checked)} />
              </label>
            </div>

            <div className={s.section}>
              <span className={s.sectionTitle}>الخلفية</span>
              <Seg value={bgType} options={[["gradient", "تدرّج"], ["solid", "لون واحد"], ["image", "صورة"]]} onChange={setBgType} />
              {bgType === "image" && (
                <>
                  <Drop accept={IMAGE_TYPES} onFiles={openBg} compact title={bgImg ? "غيّر صورة الخلفية" : "اختار صورة الخلفية"} />
                  <Range label="تغميق الصورة" value={shade} min={0} max={85} unit="%" onChange={setShade} />
                </>
              )}
              <ColorField label="النص" value={theme.text} onChange={(v) => setTheme({ ...theme, text: v, name: "" })} />
              <ColorField label="لون مميز" value={theme.accent} onChange={(v) => setTheme({ ...theme, accent: v, name: "" })} />
              {bgType !== "image" && <ColorField label="الخلفية" value={theme.c1} onChange={(v) => setTheme({ ...theme, c1: v, name: "" })} />}
              {bgType === "gradient" && <ColorField label="الخلفية ٢" value={theme.c2} onChange={(v) => setTheme({ ...theme, c2: v, name: "" })} />}
            </div>

            <div className={s.section}>
              <span className={s.sectionTitle}>اللوجو (اختياري)</span>
              <Drop accept={IMAGE_TYPES} onFiles={openLogo} compact title={logo ? "غيّر اللوجو" : "حط اللوجو بتاعك"} />
              {logo && <button type="button" className="btn ghost" onClick={() => setLogo(null)}>شيل اللوجو</button>}
              <Note>اللوجو بصيغة PNG شفافة بيطلع أحلى. ممكن تشيل خلفيته بأداة «إزالة الخلفية».</Note>
            </div>
          </>
        }
        footer={
          <>
            <Seg label="الصيغة" value={format} options={[["png", "PNG (أنقى)"], ["jpg", "JPG (أخف)"]]} onChange={setFormat} />
            {busy ? <Busy /> : <button type="button" className="btn" onClick={save}>تحميل التصميم</button>}
          </>
        }
      />
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawPoster(canvas, o) {
  const p = SIZES.find((x) => x.id === o.size) || SIZES[0];
  const W = p.w, H = p.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const t = o.theme;
  const font = siteFont();
  const unit = Math.min(W, H);

  // الخلفية
  if (o.bgType === "image" && o.bgImg) {
    const iw = o.bgImg.naturalWidth, ih = o.bgImg.naturalHeight;
    const k = Math.max(W / iw, H / ih);
    ctx.drawImage(o.bgImg, (W - iw * k) / 2, (H - ih * k) / 2, iw * k, ih * k);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const a = o.shade / 100;
    g.addColorStop(0, `rgba(0,0,0,${a * 0.7})`);
    g.addColorStop(1, `rgba(0,0,0,${Math.min(0.95, a * 1.25)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else if (o.bgType === "solid") {
    ctx.fillStyle = t.c1;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, t.c1);
    g.addColorStop(1, t.c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // إضاءة ناعمة في الركن عشان الخلفية ما تبقاش مسطحة
    const r = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, Math.max(W, H) * 0.7);
    r.addColorStop(0, hexA(t.accent, 0.22));
    r.addColorStop(1, hexA(t.accent, 0));
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
  }

  const pad = unit * 0.085;

  if (o.frame) {
    ctx.strokeStyle = hexA(t.accent, 0.55);
    ctx.lineWidth = Math.max(2, unit * 0.003);
    const m = unit * 0.035;
    roundRect(ctx, m, m, W - m * 2, H - m * 2, unit * 0.03);
    ctx.stroke();
  }

  ctx.direction = "rtl";
  ctx.textBaseline = "alphabetic";
  const maxW = W - pad * 2;
  const xFor = () => (o.align === "right" ? W - pad : o.align === "left" ? pad : W / 2);
  ctx.textAlign = o.align;

  // قياس كل العناصر الأول عشان نحدد مكانها
  const titleSize = unit * 0.095 * (o.scale / 100);
  const subSize = unit * 0.042;
  const badgeSize = unit * 0.034;
  const footSize = unit * 0.032;

  ctx.font = `600 ${titleSize}px ${font}`;
  const titleLines = o.title.trim() ? wrapLines(ctx, o.title.trim(), maxW) : [];
  ctx.font = `400 ${subSize}px ${font}`;
  const subLines = o.sub.trim() ? wrapLines(ctx, o.sub.trim(), maxW * 0.92) : [];

  const logoH = o.logo ? unit * 0.11 : 0;
  const badgeH = o.badge.trim() ? badgeSize * 2.2 : 0;
  const gap = unit * 0.035;
  const titleLH = titleSize * 1.28;
  const subLH = subSize * 1.6;
  const blockH =
    (logoH ? logoH + gap : 0) +
    (badgeH ? badgeH + gap : 0) +
    titleLines.length * titleLH +
    (subLines.length ? gap * 0.6 + subLines.length * subLH : 0);
  const footH = o.foot.trim() ? footSize * 3 : 0;

  let y =
    o.vpos === "top" ? pad + unit * 0.02 :
    o.vpos === "bottom" ? H - pad - footH - blockH :
    (H - blockH - footH * 0.5) / 2;
  const x = xFor();

  // اللوجو
  if (o.logo) {
    const lw = (o.logo.naturalWidth / o.logo.naturalHeight) * logoH;
    const lx = o.align === "right" ? x - lw : o.align === "left" ? x : x - lw / 2;
    ctx.drawImage(o.logo, lx, y, lw, logoH);
    y += logoH + gap;
  }

  // الشارة
  if (badgeH) {
    ctx.font = `600 ${badgeSize}px ${font}`;
    const tw = ctx.measureText(o.badge.trim()).width;
    const bw = tw + badgeSize * 1.8;
    const bx = o.align === "right" ? x - bw : o.align === "left" ? x : x - bw / 2;
    ctx.fillStyle = t.accent;
    roundRect(ctx, bx, y, bw, badgeH, badgeH / 2);
    ctx.fill();
    ctx.fillStyle = t.onAccent;
    ctx.textAlign = "center";
    ctx.fillText(o.badge.trim(), bx + bw / 2, y + badgeH * 0.66);
    ctx.textAlign = o.align;
    y += badgeH + gap;
  }

  // العنوان
  ctx.fillStyle = t.text;
  ctx.font = `600 ${titleSize}px ${font}`;
  for (const line of titleLines) {
    y += titleLH;
    ctx.fillText(line, x, y - titleLH * 0.24);
  }

  // السطر الفرعي
  if (subLines.length) {
    y += gap * 0.6;
    ctx.font = `400 ${subSize}px ${font}`;
    ctx.fillStyle = hexA(t.text, 0.8);
    for (const line of subLines) {
      y += subLH;
      ctx.fillText(line, x, y - subLH * 0.3);
    }
  }

  // تحت خالص
  if (footH) {
    ctx.font = `500 ${footSize}px ${font}`;
    ctx.fillStyle = t.accent;
    const fy = H - pad;
    ctx.fillText(o.foot.trim(), x, fy);
    // خط صغير فوق الكلام
    ctx.fillStyle = hexA(t.accent, 0.6);
    const lw = unit * 0.08;
    const lx = o.align === "right" ? x - lw : o.align === "left" ? x : x - lw / 2;
    ctx.fillRect(lx, fy - footSize * 1.8, lw, Math.max(2, unit * 0.003));
  }
}

function hexA(h, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || "");
  if (!m) return `rgba(255,255,255,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
