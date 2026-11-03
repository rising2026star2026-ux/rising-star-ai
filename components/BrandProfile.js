"use client";
// «هوية نشاطي»: العميل يكتب نشاطه مرة، وبتتحفظ على جهازه، والأدوات بتستخدمها.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStored, toast } from "@/lib/store";
import { BRAND_TONES, BRAND_DIALECTS, EMPTY_BRAND, brandBlock, cleanBrand } from "@/lib/brand";
import { resolveColors } from "@/lib/logostudio";
import { Seg } from "./studio/ui";
import s from "./brand.module.css";

export default function BrandProfile() {
  const [stored, setStored] = useStored("brand", null);
  const [logos] = useStored("logo-saved", []);
  const [b, setB] = useState(EMPTY_BRAND);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [taglines, setTaglines] = useState([]);

  useEffect(() => {
    // الهوية المحفوظة بتوصل بعد أول رسمة، فبنحمّلها أول ما توصل (مرة واحدة)
    if (loaded || !stored) return;
    setB({ ...EMPTY_BRAND, ...stored, colors: { ...EMPTY_BRAND.colors, ...(stored.colors || {}) } });
    setLoaded(true);
  }, [stored, loaded]);

  const set = (k) => (e) => { setB((x) => ({ ...x, [k]: typeof e === "string" ? e : e.target.value })); setDirty(true); };
  const setColor = (k) => (e) => { setB((x) => ({ ...x, colors: { ...x.colors, [k]: e.target.value } })); setDirty(true); };

  function save() {
    const c = cleanBrand(b);
    if (!c) { setErr("اكتب اسم نشاطك الأول."); return; }
    setErr("");
    setStored(c);
    setB({ ...EMPTY_BRAND, ...c });
    setDirty(false);
    toast("اتحفظت هوية نشاطك ✓");
  }

  function clear() {
    setStored(null);
    setB(EMPTY_BRAND);
    setDirty(false);
    setTaglines([]);
    toast("اتمسحت هوية نشاطك من الجهاز ده");
  }

  async function suggest() {
    if (!b.name.trim() || !b.field.trim()) { setErr("اكتب اسم النشاط ووصفه الأول، وبعدها اضغط اقترح."); return; }
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/brand-fill", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: b.name, field: b.field }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "حصلت مشكلة. جرّب تاني.");
      // بنملا الفاضي بس، وما نغيّرش اللي العميل كتبه
      setB((x) => ({ ...x, audience: x.audience || j.audience, tone: x.tone === EMPTY_BRAND.tone ? j.tone : x.tone, dialect: x.dialect === EMPTY_BRAND.dialect ? j.dialect : x.dialect }));
      setTaglines(j.taglines || []);
      setDirty(true);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  const preview = useMemo(() => brandBlock(cleanBrand(b)), [b]);
  const logoColors = (logos || []).slice(0, 6).map((c) => ({ c, col: resolveColors(c) }));

  return (
    <div className={s.root}>
      <section className={s.card}>
        <h2>نشاطك</h2>
        <div className={s.row2}>
          <label className={s.field}><span>اسم النشاط</span><input className={s.input} value={b.name} onChange={set("name")} maxLength={60} placeholder="مثلاً: نور للحلويات" /></label>
          <label className={s.field}><span>الاسم اللاتيني (اختياري)</span><input className={s.input} value={b.latin} onChange={set("latin")} maxLength={60} dir="ltr" placeholder="Noor Sweets" /></label>
        </div>
        <label className={s.field}><span>نشاطك في سطرين</span><textarea className={s.input} value={b.field} onChange={set("field")} maxLength={240} placeholder="مثلاً: حلويات شرقية وتورتات للمناسبات بتوصيل لمدينة نصر والتجمع" /></label>
        <div className={s.acts}>
          <button type="button" className="btn ghost" onClick={suggest} disabled={busy}>{busy ? "بيفكر…" : "اقترح لي الباقي"}</button>
          <small className={s.note}>بيملا الجمهور والنبرة واللهجة، وبيقترح شعارات. وأنت تعدّل.</small>
        </div>
        <label className={s.field}><span>جمهورك</span><input className={s.input} value={b.audience} onChange={set("audience")} maxLength={200} placeholder="مثلاً: ستات وبنات في مصر من 20 لـ 40" /></label>
        <label className={s.field}>
          <span>الشعار الصغير (اختياري)</span>
          <input className={s.input} value={b.tagline} onChange={set("tagline")} maxLength={80} placeholder="مثلاً: طعم البيت" />
        </label>
        {taglines.length > 0 && <div className={s.chips}>{taglines.map((t) => <button key={t} type="button" className={s.chip} onClick={() => { setB((x) => ({ ...x, tagline: t })); setDirty(true); }}>{t}</button>)}</div>}
      </section>

      <section className={s.card}>
        <h2>أسلوب كلامك</h2>
        <Seg label="النبرة" value={b.tone} onChange={set("tone")} options={BRAND_TONES} />
        <Seg label="اللهجة" value={b.dialect} onChange={set("dialect")} options={BRAND_DIALECTS} />
        <label className={s.field}><span>رقم الواتساب أو التواصل (اختياري)</span><input className={s.input} value={b.whatsapp} onChange={set("whatsapp")} maxLength={40} dir="ltr" inputMode="tel" placeholder="01012345678" /><small>بيتحط في إعلانات وباكدجات الطلب بدل ما تكتبه كل مرة.</small></label>
        <label className={s.field}><span>ملاحظات للأدوات (اختياري)</span><textarea className={s.input} value={b.notes} onChange={set("notes")} maxLength={300} placeholder="مثلاً: ما تستخدمش كلمة رخيص، وقول دايماً إن الحلويات طازة يومياً" /></label>
      </section>

      <section className={s.card}>
        <h2>ألوانك</h2>
        <div className={s.colors}>
          {[["c1", "الأساسي"], ["c2", "الثانوي"], ["c3", "التمييز"]].map(([k, l]) => (
            <label key={k}>{l}<input type="color" value={b.colors[k]} onChange={setColor(k)} /></label>
          ))}
        </div>
        {logoColors.length > 0 && (
          <>
            <small className={s.note}>أو خد الألوان من لوجو عملته في مولد اللوجو:</small>
            <div className={s.logos}>
              {logoColors.map(({ c, col }, i) => (
                <button key={i} type="button" className={s.logoPick} onClick={() => { setB((x) => ({ ...x, colors: { c1: col.c1, c2: col.c2, c3: col.c3 } })); setDirty(true); }}>
                  <i><span style={{ background: col.c1 }} /><span style={{ background: col.c2 }} /><span style={{ background: col.c3 }} /></i>{c.name}
                </button>
              ))}
            </div>
          </>
        )}
        <small className={s.note}>الألوان بتستخدمها بعض الأدوات البصرية. لو معندكش لوجو، <Link href="/tool/logo-maker" style={{ color: "var(--blue)", textDecoration: "underline" }}>اعمله من هنا</Link>.</small>
      </section>

      {err && <p className={s.err} role="alert">{err}</p>}
      <div className={s.acts}>
        <button type="button" className="btn" onClick={save} disabled={!dirty && !!stored}>احفظ هوية نشاطي</button>
        {!dirty && stored && <span className={s.saved}>محفوظة ✓</span>}
        {stored && <button type="button" className="btn ghost" onClick={clear}>امسح من الجهاز ده</button>}
      </div>

      <section className={s.card}>
        <h2>اللي الأدوات هتشوفه عنك</h2>
        <div className={s.preview}>{preview || "املا اسم النشاط وهيظهر هنا بالظبط الكلام اللي بيتبعت للأدوات."}</div>
        <p className={s.note}>الهوية محفوظة على جهازك بس. بتتبعت للذكاء الاصطناعي مع طلبك عشان يكتب على مقاس نشاطك، وبتقدر توقف ده في أي أداة.</p>
      </section>

      <section className={s.card}>
        <h2>فين بتشتغل</h2>
        <div className={s.uses}>
          <div className={s.use}><b>أدوات الكتابة والتسويق</b><span>مربع «استخدم هوية نشاطي» بيظهر فوق خانة الطلب في أدوات التسويق والسوشيال والأعمال والتجارة والكتابة والتصميم.</span></div>
          <div className={s.use}><b>ستوديو البيّاع</b><span>«صوّرها بموبايلك» و«اتكلم واحنا نكتب» بيكتبوا بنبرتك ولهجتك وبرقمك.</span></div>
          <div className={s.use}><b>مولد اللوجو</b><span>بيتملى باسمك ونشاطك وشعارك وأسلوب مناسب لنبرتك. <Link href="/tool/logo-maker">افتحه</Link></span></div>
        </div>
      </section>
    </div>
  );
}
