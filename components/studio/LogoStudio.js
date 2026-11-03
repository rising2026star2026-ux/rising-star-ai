"use client";
// مولّد لوجو: اكتب اسمك ونشاطك ← 8 تصميمات مقترحة ← عدّل الرمز والألوان والخط والتركيب ← نزّل SVG وPNG وصورة بروفايل.
// الرسم بيتم على جهازك. بس فهم النشاط واقتراح الشعارات بيتم بالذكاء الاصطناعي.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Seg, Note, Range, TextField, styles as s } from "./ui";
import { download } from "./util";
import { toast, useStored } from "@/lib/store";
import {
  SYMBOLS, PALETTES, FONTS, STYLES, LAYOUTS,
  generateConcepts, buildLogo, wrapSvg, buildIconTile, buildCardMockup,
  resolveColors, brandTileColors,
} from "@/lib/logostudio";
import { ensureLogoFont, fontCssFor, measureEm, svgToPng } from "@/lib/logofonts";
import { TONE_TO_LOGO_STYLE } from "@/lib/brand";
import l from "./logo.module.css";

const MOODS = [["", "تلقائي"], ["warm", "دافئ"], ["cool", "هادئ"], ["dark", "غامق وقوي"], ["soft", "ناعم"], ["luxury", "فاخر"], ["nature", "طبيعي"]];
const BGS = [["light", "فاتح"], ["dark", "غامق"], ["brand", "بلون العلامة"], ["checker", "شفاف"]];
const textOf = (c) => `${c.name || ""} ${c.showLatin ? c.latin || "" : ""} ${c.sub || ""}`;

/** لوجو SVG مرسوم جوه الصفحة (عشان يستخدم الخطوط المحمّلة) */
function Logo({ cfg, measure, layout, dark, colors, className }) {
  const html = useMemo(() => wrapSvg(buildLogo(cfg, { measure, layout, dark, colors })), [cfg, measure, layout, dark, colors]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Svg({ svg, className }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export default function LogoStudio() {
  const [form, setForm] = useState({ name: "", desc: "", latin: "", sub: "", style: "modern", mood: "" });
  const [concepts, setConcepts] = useState([]);
  const [sel, setSel] = useState(null);
  const [tick, setTick] = useState(0);
  const [ai, setAi] = useState("idle"); // idle | loading | ok | fail
  const [taglines, setTaglines] = useState([]);
  const [bg, setBg] = useState("light");
  const [tile, setTile] = useState({ kind: "brand", shape: "squircle" });
  const [busy, setBusy] = useState("");
  const [saved, setSaved] = useStored("logo-saved", []);
  const [brand] = useStored("brand", null);
  const prefilled = useRef(false);
  const run = useRef(0);
  const seed = useRef(0);
  const selRef = useRef(null);
  selRef.current = sel;

  const measure = useCallback((t, font) => measureEm(t, font), [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFonts = useCallback((list) => {
    const seen = new Set();
    for (const c of list) {
      const key = `${c.font}|${/[A-Za-z0-9]/.test(textOf(c)) ? "l" : ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      ensureLogoFont(c.font, textOf(c)).then(() => setTick((t) => t + 1));
    }
  }, []);

  // من «هوية نشاطي»: بيملا الاسم والنشاط والشعار والأسلوب أول ما الصفحة تفتح (مرة واحدة ولو الخانات فاضية)
  useEffect(() => {
    if (prefilled.current || !brand?.name) return;
    prefilled.current = true;
    setForm((f) => (f.name ? f : { ...f, name: brand.name, latin: brand.latin || "", desc: brand.field || "", sub: brand.tagline || "", style: TONE_TO_LOGO_STYLE[brand.tone] || f.style }));
  }, [brand]);

  const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function generate(more = false) {
    if (!form.name.trim()) { toast("اكتب اسم علامتك الأول"); return; }
    const id = ++run.current;
    seed.current = more ? seed.current + 1 : 0;
    const local = generateConcepts({ ...form, seed: seed.current, n: 8 });
    setConcepts(local);
    setSel(null);
    loadFonts(local);
    setAi("loading");
    try {
      const res = await fetch("/api/logo-gen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, desc: form.desc, style: form.style }) });
      const data = await res.json().catch(() => ({}));
      if (id !== run.current) return;
      if (!res.ok) throw new Error(data.error || "x");
      setTaglines(data.taglines || []);
      const latin = form.latin || data.latin || "";
      if (!form.latin && data.latin) setForm((f) => ({ ...f, latin: data.latin }));
      // لو المستخدم بدأ يعدّل تصميم، منبدّلش المقترحات من تحت إيده
      if (!selRef.current) {
        const merged = generateConcepts({ ...form, latin, seed: seed.current, n: 8, hints: data });
        setConcepts(merged);
        loadFonts(merged);
      }
      setAi("ok");
    } catch {
      if (id === run.current) setAi("fail");
    }
  }

  function pick(c) {
    setSel({ ...c });
    ensureLogoFont(c.font, textOf(c)).then(() => setTick((t) => t + 1));
    setTimeout(() => document.getElementById("logo-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function edit(patch) {
    setSel((c) => ({ ...c, ...patch }));
    if (patch.font || patch.name || patch.latin || patch.sub) {
      const c = { ...selRef.current, ...patch };
      ensureLogoFont(c.font, textOf(c)).then(() => setTick((t) => t + 1));
    }
  }

  const col = sel ? resolveColors(sel) : null;
  const bgStyle = bg === "dark" ? l.bgDark : bg === "checker" ? l.bgChecker : l.bgLight;
  const bigBg = bg === "brand" && col ? { background: col.c1 } : undefined;
  const brandColors = useMemo(() => (col ? brandTileColors(col) : null), [col?.c1, col?.c2, col?.c3]); // eslint-disable-line react-hooks/exhaustive-deps

  // ───── التصدير ─────
  async function exportAs(kind) {
    if (!sel || busy) return;
    setBusy(kind);
    try {
      const css = await fontCssFor(sel.font, textOf(sel));
      const base = (sel.name || "logo").replace(/[^\w؀-ۿ]+/g, "-").slice(0, 30) || "logo";
      const png = async (r, W, background) => {
        const H = Math.round((W * r.h) / r.w);
        const blob = await svgToPng(wrapSvg(r, { bg: background, fontCss: css, size: [W, H] }), W, H);
        return blob;
      };
      if (kind === "svg") {
        const r = buildLogo(sel, { measure });
        download(new Blob([wrapSvg(r, { fontCss: css })], { type: "image/svg+xml" }), `${base}.svg`);
      } else if (kind === "png") {
        download(await png(buildLogo(sel, { measure }), 2048, null), `${base}.png`);
      } else if (kind === "white") {
        download(await png(buildLogo(sel, { measure }), 2048, "#ffffff"), `${base}-white.png`);
      } else if (kind === "dark") {
        download(await png(buildLogo(sel, { measure, dark: true }), 2048, "#0f172a"), `${base}-dark.png`);
      } else if (kind === "icon") {
        download(await png(buildLogo(sel, { measure, layout: "icon" }), 1024, null), `${base}-icon.png`);
      } else if (kind === "avatar") {
        const r = buildIconTile(sel, { tile: tile.kind, shape: tile.shape, measure });
        download(await png(r, 1024, null), `${base}-profile.png`);
      } else if (kind === "card") {
        const r = buildCardMockup(sel, { measure });
        download(await png(r, 2100, null), `${base}-card.png`);
      }
    } catch {
      toast("ما قدرناش نجهّز الملف. جرّب تاني أو جرّب SVG.");
    } finally {
      setBusy("");
    }
  }

  function save() {
    if (!sel) return;
    const next = [{ ...sel, savedAt: Date.now() }, ...saved.filter((x) => JSON.stringify({ ...x, savedAt: 0 }) !== JSON.stringify({ ...sel, savedAt: 0 }))].slice(0, 12);
    setSaved(next);
    toast("اتحفظ التصميم على جهازك ✓");
  }

  // الخطوط بتتحمّل لما نفتح المحفوظات
  useEffect(() => { if (saved.length) loadFonts(saved); }, [saved.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const mock = useMemo(() => {
    if (!sel) return null;
    const c = resolveColors(sel);
    const inline = (r, size) => wrapSvg(r, { size });
    const circle = buildIconTile(sel, { tile: "brand", shape: "circle", measure });
    return {
      card: inline(buildCardMockup(sel, { measure }), [525, 300]),
      appLight: inline(buildIconTile(sel, { tile: "light", measure }), [96, 96]),
      appBrand: inline(buildIconTile(sel, { tile: "brand", measure }), [96, 96]),
      appDark: inline(buildIconTile(sel, { tile: "dark", measure }), [96, 96]),
      avatar: inline(circle, [150, 150]),
      onBrand: wrapSvg(buildLogo(sel, { measure, colors: brandTileColors(c) }), { bg: c.c1 }),
      onDark: wrapSvg(buildLogo(sel, { measure, dark: true }), { bg: "#0f172a" }),
    };
  }, [sel, measure]);

  const hasResults = concepts.length > 0;

  return (
    <div className={l.root}>
      <span className={s.badge}><i />الرسم بيتم على جهازك، ومفيش علامة مائية</span>

      <form className={l.form} onSubmit={(e) => { e.preventDefault(); generate(false); }}>
        <div className={l.row2}>
          <TextField label="اسم علامتك" value={form.name} onChange={setF("name")} placeholder="مثلاً: نور للحلويات" maxLength={40} />
          <TextField label="اسم لاتيني (اختياري)" value={form.latin} onChange={setF("latin")} placeholder="Noor Sweets" dir="ltr" maxLength={40} />
        </div>
        <TextField label="نشاطك في سطر" value={form.desc} onChange={setF("desc")} placeholder="مثلاً: محل حلويات شرقية وتورتات للمناسبات" maxLength={160} />
        <TextField label="الشعار الصغير (اختياري)" value={form.sub} onChange={setF("sub")} placeholder="مثلاً: طعم البيت" maxLength={40} />
        <Seg label="الأسلوب" value={form.style} onChange={setF("style")} options={STYLES.map((x) => [x.id, x.name])} />
        <Seg label="مزاج الألوان" value={form.mood} onChange={setF("mood")} options={MOODS} />
        <div className={l.formBtns}>
          <button className="btn" type="submit">{hasResults ? "ولّد من جديد" : "اعمل لي لوجو"}</button>
          {hasResults && <button type="button" className="btn ghost" onClick={() => generate(true)}>أفكار تانية</button>}
        </div>
        <p className={l.hint}>كل ما كان وصف نشاطك أوضح، كانت الرموز أنسب. الذكاء الاصطناعي بيختار من رموز وألوان وخطوط جاهزة ومراجعة، ومش بيرسم عشوائي، فالنتيجة نضيفة وتنفع للطباعة.</p>
      </form>

      {saved.length > 0 && (
        <section className={l.sec} aria-label="تصميماتك المحفوظة">
          <div className={l.secHead}><h2>محفوظاتك</h2><span className={l.badge}>على جهازك بس</span></div>
          <div className={l.saved}>
            {saved.map((c, i) => (
              <button key={i} type="button" className={l.savedItem} onClick={() => { setForm((f) => ({ ...f, name: c.name, latin: c.latin || "", sub: c.sub || "" })); pick(c); }} aria-label={`افتح تصميم ${c.name}`}>
                <Logo cfg={c} measure={measure} />
              </button>
            ))}
          </div>
        </section>
      )}

      {hasResults && (
        <section className={l.sec} aria-label="التصميمات المقترحة">
          <div className={l.secHead}>
            <h2>اختار تصميم تبدأ منه</h2>
            {ai === "loading" && <span className={l.badge}>الذكاء الاصطناعي بيفهم نشاطك…</span>}
            {ai === "ok" && <span className={l.badge}>اقتراحات مخصصة لنشاطك ✓</span>}
          </div>
          {ai === "fail" && <p className={l.err}>اقتراحات الذكاء الاصطناعي ما وصلتش، فده تصميمات حسب وصفك. جرّب «أفكار تانية».</p>}
          <div className={l.grid}>
            {concepts.map((c, i) => (
              <button key={`${c.symbol}${c.palette}${c.font}${i}`} type="button" className={`${l.card} ${sel && sel.symbol === c.symbol && sel.palette === c.palette && sel.font === c.font ? l.cardOn : ""}`} onClick={() => pick(c)}>
                <Logo cfg={c} measure={measure} className={l.pv} />
                <span className={l.cardFoot}>{c.idea ? c.idea : <><b>{SYMBOLS.find((x) => x.id === c.symbol)?.name}</b> · {PALETTES.find((x) => x.id === c.palette)?.name}</>}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {sel && col && (
        <section className={l.sec} id="logo-editor" aria-label="تعديل اللوجو">
          <div className={l.secHead}>
            <h2>عدّل على مزاجك</h2>
            <span className={l.formBtns}>
              <button type="button" className="btn ghost" onClick={save}>احفظ التصميم</button>
            </span>
          </div>
          <div className={l.editor}>
            <div className={l.stage}>
              <div className={`${l.big} ${bgStyle}`} style={bigBg}>
                <Logo cfg={sel} measure={measure} dark={bg === "dark"} colors={bg === "brand" ? brandColors : undefined} />
              </div>
              <Seg value={bg} onChange={setBg} options={BGS} />
              <Seg label="التركيب" value={sel.layout} onChange={(v) => edit({ layout: v })} options={LAYOUTS} />
            </div>

            <div className={l.panel}>
              <div className={l.group}>
                <b>النصوص</b>
                <TextField label="الاسم" value={sel.name} onChange={(v) => edit({ name: v })} maxLength={40} />
                <div className={l.row2}>
                  <TextField label="اسم لاتيني" value={sel.latin || ""} onChange={(v) => edit({ latin: v })} dir="ltr" maxLength={40} />
                  <TextField label="الشعار الصغير" value={sel.sub || ""} onChange={(v) => edit({ sub: v })} maxLength={40} />
                </div>
                <Seg value={!!sel.showLatin} onChange={(v) => edit({ showLatin: v })} options={[[false, "من غير اسم لاتيني"], [true, "اعرض الاسم اللاتيني"]]} />
                {taglines.length > 0 && (
                  <div className={l.chips} aria-label="شعارات مقترحة">
                    {taglines.map((t) => <button key={t} type="button" className={l.chip} onClick={() => edit({ sub: t })}>{t}</button>)}
                  </div>
                )}
              </div>

              <div className={l.group}>
                <b>الرمز</b>
                <div className={l.symGrid} role="radiogroup" aria-label="الرمز">
                  {SYMBOLS.map((x) => (
                    <button key={x.id} type="button" role="radio" aria-checked={sel.symbol === x.id} aria-label={x.name} title={x.name} className={`${l.sym} ${sel.symbol === x.id ? l.symOn : ""}`} onClick={() => edit({ symbol: x.id })}>
                      <Logo cfg={{ ...sel, symbol: x.id }} measure={measure} layout="icon" />
                    </button>
                  ))}
                </div>
                <Range label="حجم الرمز" value={Math.round((sel.iconScale ?? 1) * 100)} min={60} max={150} step={5} unit="%" onChange={(v) => edit({ iconScale: v / 100 })} />
                <Range label="المسافة بين الرمز والاسم" value={Math.round((sel.gap ?? 1) * 100)} min={40} max={200} step={10} unit="%" onChange={(v) => edit({ gap: v / 100 })} />
                <Range label="حجم الاسم" value={Math.round((sel.nameScale ?? 1) * 100)} min={60} max={140} step={5} unit="%" onChange={(v) => edit({ nameScale: v / 100 })} />
              </div>

              <div className={l.group}>
                <b>الألوان</b>
                <div className={l.pals} role="radiogroup" aria-label="لوحة الألوان">
                  {PALETTES.map((p) => (
                    <button key={p.id} type="button" role="radio" aria-checked={sel.palette === p.id && !sel.custom} className={`${l.pal} ${sel.palette === p.id && !sel.custom ? l.palOn : ""}`} onClick={() => edit({ palette: p.id, custom: null })}>
                      <i><span style={{ background: p.c1 }} /><span style={{ background: p.c2 }} /><span style={{ background: p.c3 }} /></i>
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className={l.colors}>
                  {[["c1", "الأساسي"], ["c2", "الثانوي"], ["c3", "التمييز"]].map(([k, label]) => (
                    <label key={k}>{label}<input type="color" value={col[k]} onChange={(e) => edit({ custom: { ...(sel.custom || {}), c1: col.c1, c2: col.c2, c3: col.c3, ink: sel.custom?.ink || col.ink, [k]: e.target.value } })} /></label>
                  ))}
                </div>
                <label className={l.colors} style={{ gridTemplateColumns: "1fr" }}>
                  لون الاسم
                  <input type="color" value={col.ink} onChange={(e) => edit({ custom: { ...(sel.custom || {}), c1: col.c1, c2: col.c2, c3: col.c3, ink: e.target.value } })} />
                </label>
                {sel.custom && <button type="button" className="btn ghost" onClick={() => edit({ custom: null })}>رجّع ألوان اللوحة</button>}
              </div>

              <div className={l.group}>
                <b>الخط</b>
                <div className={l.fonts} role="radiogroup" aria-label="الخط">
                  {FONTS.map((f) => (
                    <button key={f.id} type="button" role="radio" aria-checked={sel.font === f.id} className={`${l.font} ${sel.font === f.id ? l.fontOn : ""}`} onClick={() => edit({ font: f.id })}>{f.name}</button>
                  ))}
                </div>
                <p className={l.hint}>لو الخط ما ظهرش، اتأكد من الإنترنت وجرّب تاني. الخطوط مفتوحة المصدر وتنفع للاستخدام التجاري.</p>
              </div>
            </div>
          </div>

          <div className={l.secHead}><h2>نزّل ملفاتك</h2></div>
          <div className={l.dl}>
            <button type="button" className={l.dlMain} disabled={!!busy} onClick={() => exportAs("svg")}><b>SVG (الأفضل)</b><small>يتكبّر لأي مقاس والخط جواه</small></button>
            <button type="button" disabled={!!busy} onClick={() => exportAs("png")}><b>PNG شفاف</b><small>2048 بكسل، للمواقع والتصميم</small></button>
            <button type="button" disabled={!!busy} onClick={() => exportAs("white")}><b>PNG خلفية بيضاء</b><small>للمستندات والفواتير</small></button>
            <button type="button" disabled={!!busy} onClick={() => exportAs("dark")}><b>نسخة للخلفية الغامقة</b><small>ألوان معدّلة، 2048 بكسل</small></button>
            <button type="button" disabled={!!busy} onClick={() => exportAs("icon")}><b>الرمز فقط</b><small>PNG شفاف 1024 بكسل</small></button>
            <button type="button" disabled={!!busy} onClick={() => exportAs("card")}><b>كارت شخصي</b><small>PNG للوجه والخلف</small></button>
          </div>
          <div className={l.group}>
            <b>صورة البروفايل (فيسبوك وإنستجرام وواتساب)</b>
            <div className={l.row2}>
              <Seg value={tile.kind} onChange={(v) => setTile((t) => ({ ...t, kind: v }))} options={[["brand", "بلون العلامة"], ["light", "أبيض"], ["dark", "غامق"]]} />
              <Seg value={tile.shape} onChange={(v) => setTile((t) => ({ ...t, shape: v }))} options={[["squircle", "مربع مدوّر"], ["circle", "دائرة"]]} />
            </div>
            <div className={l.formBtns}>
              <button type="button" className="btn" disabled={!!busy} onClick={() => exportAs("avatar")}>{busy === "avatar" ? "ثواني…" : "نزّل صورة البروفايل"}</button>
              {busy && busy !== "avatar" && <span className={l.hint}>بيجهّز الملف…</span>}
            </div>
          </div>

          {mock && (
            <>
              <div className={l.secHead}><h2>شكله في الواقع</h2></div>
              <div className={l.mock}>
                <div className={`${l.mockItem} ${l.mockWide}`}>
                  <Svg svg={mock.card} className={`${l.mockBox} ${l.shadow}`} />
                  كارت شخصي
                </div>
                <div className={l.mockItem}>
                  <div className={`${l.mockBox} ${l.tileRow}`}>
                    <Svg svg={mock.appLight} className={l.shadow} />
                    <Svg svg={mock.appBrand} className={l.shadow} />
                    <Svg svg={mock.appDark} className={l.shadow} />
                  </div>
                  أيقونة تطبيق
                </div>
                <div className={l.mockItem}>
                  <Svg svg={mock.avatar} className={l.mockBox} />
                  صورة بروفايل
                </div>
                <div className={l.mockItem}>
                  <Svg svg={mock.onBrand} className={l.mockBox} />
                  على لون علامتك
                </div>
                <div className={l.mockItem}>
                  <Svg svg={mock.onDark} className={l.mockBox} />
                  على خلفية غامقة
                </div>
              </div>
              <Note>جرّب تصغّر اللوجو لحجم أيقونة الموبايل: التصميم الناجح بيفضل واضح وهو صغير.</Note>
            </>
          )}
        </section>
      )}
    </div>
  );
}
