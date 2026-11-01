"use client";
// «فاحص الرفض»: الفحص بيشتغل فوراً في المتصفح وانت بتكتب (بالكود، من غير انتظار)،
// وزرار التصليح بيطلب من الموديل نسخة نضيفة، والنسخة دي بتتفحص تاني بنفس القواعد قبل ما تظهر لك.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { checkListing, LIMITS, utf8Bytes } from "@/lib/amazon";
import { MarketChips, Meter, StatusBanner, IssueList, ListingView } from "./shared";
import s from "../seller/seller.module.css";
import a from "./amazon.module.css";

export const CHECK_HANDOFF = "rs:amz-check";
const EXAMPLE = {
  title: "طقم حلل جرانيت 10 قطع ✨ شحن مجاني!! الأكثر مبيعاً في مصر - ضمان 100% استرداد الأموال",
  bullets: ["غير لاصق وسهل التنظيف، تقدر تتواصل معانا واتساب 01012345678 لأي استفسار", "مناسب لكل أنواع البوتجاز", "", "", ""],
};

export default function CheckTool() {
  const [market, setMarket] = useState("eg");
  const [brand, setBrand] = useState("");
  const [titleMax, setTitleMax] = useState(LIMITS.title);
  const [title, setTitle] = useState("");
  const [bullets, setBullets] = useState(["", "", "", "", ""]);
  const [description, setDescription] = useState("");
  const [backend, setBackend] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState(null);
  const ctl = useRef(null);
  const resRef = useRef(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECK_HANDOFF);
      if (raw) {
        const h = JSON.parse(raw);
        if (h.title) setTitle(String(h.title).slice(0, 700));
        if (Array.isArray(h.bullets)) setBullets([...h.bullets, "", "", "", "", ""].slice(0, 5).map((b) => String(b || "").slice(0, 1200)));
        if (h.description) setDescription(String(h.description).slice(0, 4500));
        if (h.backend) setBackend(String(h.backend).slice(0, 1200));
        if (h.brand) setBrand(String(h.brand).slice(0, 60));
        sessionStorage.removeItem(CHECK_HANDOFF);
      }
    } catch {}
    return () => ctl.current?.abort();
  }, []);

  const has = !!(title.trim() || bullets.some((b) => b.trim()) || description.trim() || backend.trim());
  // الفحص الفوري: بيتحسب مع كل حرف بتكتبه
  const live = useMemo(
    () => (has ? checkListing({ title, bullets, description, backend }, { titleMax, brand }) : null),
    [has, title, bullets, description, backend, titleMax, brand],
  );

  const setBullet = (i, v) => setBullets((b) => b.map((x, k) => (k === i ? v : x)));

  async function fix() {
    setError(""); setBusy(true); setRes(null);
    ctl.current?.abort();
    ctl.current = new AbortController();
    try {
      const r = await fetch("/api/amazon/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, bullets, description, backend, brand, market, titleMax }),
        signal: ctl.current.signal,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "حصلت مشكلة. جرّب تاني.");
      setRes(j);
      requestAnimationFrame(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      if (e?.name !== "AbortError") setError(e.message);
    } finally { setBusy(false); }
  }

  const bytes = utf8Bytes(backend);

  return (
    <div className={s.body}>
      <section className={s.card} aria-labelledby="ck-h">
        <h2 id="ck-h">الصق ليستنجك زي ما هو</h2>
        <p className="lead" style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: "0.9rem" }}>الفحص بيشتغل وانت بتكتب، من غير ما تضغط حاجة.</p>

        <div className={s.field}><MarketChips value={market} onChange={setMarket} /></div>

        <div className={s.field}>
          <label className={s.label} htmlFor="ck-title">
            <span>العنوان</span>
            <button type="button" className={s.miniBtn} onClick={() => { setTitle(EXAMPLE.title); setBullets([...EXAMPLE.bullets]); }}>جرّب بمثال</button>
          </label>
          <textarea id="ck-title" className={s.textarea} style={{ minHeight: 78 }} value={title} maxLength={700} onChange={(e) => setTitle(e.target.value)} placeholder="الصق عنوان المنتج هنا" />
          <div className={a.row} style={{ justifyContent: "space-between", marginTop: 4 }}>
            <span className={a.hint} style={{ margin: 0 }}>الموبايل بيعرض أول {LIMITS.titleMobile} حرف تقريباً</span>
            <Meter value={title.length} max={titleMax} />
          </div>
        </div>

        <div className={s.field}>
          <span className={s.label}><span>نقاط المميزات</span><small>لحد 5</small></span>
          <div className={a.stack} style={{ gap: 8 }}>
            {bullets.map((b, i) => (
              <div key={i} className={a.bulletRow}>
                <b aria-hidden="true">{i + 1}</b>
                <div>
                  <textarea className={s.textarea} style={{ minHeight: 56 }} rows={2} value={b} maxLength={1200} onChange={(e) => setBullet(i, e.target.value)} aria-label={`النقطة ${i + 1}`} placeholder={i === 0 ? "الصق النقطة الأولى" : ""} />
                  {b && <div style={{ textAlign: "end", marginTop: 3 }}><Meter value={b.length} max={LIMITS.bullet} /></div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <details className={a.details}>
          <summary>الوصف وكلمات البحث الخلفية والبراند</summary>
          <div className={s.field}>
            <label className={s.label} htmlFor="ck-desc"><span>الوصف</span><Meter value={description.length} max={LIMITS.description} /></label>
            <textarea id="ck-desc" className={s.textarea} value={description} maxLength={4500} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="ck-back"><span>كلمات البحث الخلفية</span><Meter value={bytes} max={LIMITS.backendBytes} unit="بايت" /></label>
            <input id="ck-back" className={s.input} value={backend} maxLength={1200} onChange={(e) => setBackend(e.target.value)} />
            <p className={a.hint}>الحد بالبايت مش بالحروف: الحرف العربي بيحسب بايتين، فالعربي بيخلص أسرع من الإنجليزي.</p>
          </div>
          <div className={s.row2}>
            <div className={s.field} style={{ marginBottom: 0 }}>
              <label className={s.label} htmlFor="ck-brand"><span>اسم البراند</span><small>اختياري</small></label>
              <input id="ck-brand" className={s.input} value={brand} maxLength={60} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className={s.field} style={{ marginBottom: 0 }}>
              <label className={s.label} htmlFor="ck-max"><span>حد العنوان في تصنيفك</span><small>الافتراضي 200</small></label>
              <input id="ck-max" className={s.input} inputMode="numeric" value={titleMax} onChange={(e) => setTitleMax(Math.min(200, Math.max(20, Number(e.target.value.replace(/\D/g, "")) || 20)))} />
            </div>
          </div>
          <p className={a.hint}>بعض التصنيفات حدها أقل من 200 (الملابس مثلاً). افتح دليل التصنيف في Seller Central واكتب الحد الحقيقي هنا.</p>
        </details>
      </section>

      {live && (
        <section className={s.card} aria-labelledby="ck-live" aria-live="polite">
          <h2 id="ck-live">نتيجة الفحص الفوري</h2>
          <div className={a.stack}>
            <StatusBanner status={live.status} stats={live.stats} />
            <IssueList issues={live.issues} />
            <button type="button" className={`${s.cta} ${s.blue}`} onClick={fix} disabled={busy || !title.trim()}>
              {busy ? <><span className={`${s.spin} ${s.spinLight}`} aria-hidden="true" />بنراجع ونصلّح…</> : "✨ صلّحلي الليستنج"}
            </button>
            <p className={s.ctaNote} style={{ margin: 0 }}>التصليح بيحافظ على معلومات منتجك، وما بيضيفش مواصفات من عنده.</p>
            {error && <p className={s.err} role="alert">{error}</p>}
          </div>
        </section>
      )}

      {res && <Result res={res} titleMax={titleMax} refEl={resRef} />}
    </div>
  );
}

function Result({ res, titleMax, refEl }) {
  const { fixed, after, extra, invented, ok } = res;
  if (!ok || !fixed) {
    return (
      <section className={s.card} ref={refEl}>
        <h2>التصليح الذكي مش متاح دلوقتي</h2>
        <p className={s.note}>الفحص الآلي اللي فوق شغال وصحيح. المراجع الذكي مشغول، جرّب تاني بعد دقيقة.</p>
      </section>
    );
  }
  const changed = fixed.title !== res.input.title;
  return (
    <section className={s.card} ref={refEl} aria-labelledby="ck-fixed">
      <div className={a.stack}>
        <div className={a.fixedHead}><h2 id="ck-fixed">النسخة المصلّحة</h2></div>
        <StatusBanner status={after.status} stats={after.stats} />
        {extra.length > 0 && (
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>ملاحظات إضافية من المراجع الذكي</h3>
            <IssueList issues={extra} limit={6} />
          </div>
        )}
        {invented.length > 0 && (
          <p className={s.err} role="alert">
            <b>راجع الأرقام:</b> الرقم {invented.join("، ")} ظهر في النسخة المصلّحة ومش موجود في ليستنجك الأصلي. تأكد منه قبل ما تنسخ.
          </p>
        )}
        <ListingView listing={fixed} titleMax={titleMax} />
        {after.issues.length > 0 && (
          <details className={a.details}>
            <summary>اللي لسه فيه ملاحظات في النسخة المصلّحة ({after.issues.length})</summary>
            <IssueList issues={after.issues} limit={6} />
          </details>
        )}
        <p className={a.hint}>{changed ? "اتغيّر العنوان عن الأصلي." : "العنوان الأصلي كان سليم فما اتغيّرش."} الصق النسخة في Seller Central وشوف رسائل الحالة هناك، لأن أمازون هي الحكم الأخير.</p>
        <Link href="/amazon/listing" className={s.miniBtn} style={{ justifySelf: "start" }}>محتاج ليستنج من الصفر؟ ←</Link>
      </div>
    </section>
  );
}
