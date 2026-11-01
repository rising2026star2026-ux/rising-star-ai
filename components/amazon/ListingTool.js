"use client";
// «ليستنج من وصف عامي أو صورة»: التاجر يكتب بكلامه، ونطلّع له عربي وإنجليزي جاهزين.
// أي ناتج بيتفحص بنفس قواعد الفاحص قبل ما يتعرض، ولو فيه مخالفة بيتصلح تلقائياً مرة.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fileToDataUrl } from "@/lib/imagefile";
import { MarketChips, StatusBanner, IssueList, ListingView } from "./shared";
import { CHECK_HANDOFF } from "./CheckTool";
import s from "../seller/seller.module.css";
import a from "./amazon.module.css";

const EXAMPLE = "طقم حلل جرانيت تركي 10 قطع، لونه رمادي، مش بيلزق، بيشتغل على الغاز والكهرباء والإنداكشن، والغطا زجاج. عليه ضمان سنة من الشركة.";
const LANGS = { both: "عربي وإنجليزي", en: "إنجليزي", ar: "عربي" };

export default function ListingTool() {
  const router = useRouter();
  const [market, setMarket] = useState("eg");
  const [langs, setLangs] = useState("both");
  const [desc, setDesc] = useState("");
  const [brand, setBrand] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState(null);
  const [tab, setTab] = useState("en");
  const [answers, setAnswers] = useState("");
  const ctl = useRef(null);
  const resRef = useRef(null);
  useEffect(() => () => ctl.current?.abort(), []);

  async function onImage(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { setImage(await fileToDataUrl(f, 1024, 0.85)); } catch (er) { setError(er.message); }
  }

  async function run(withAnswers = false) {
    const text = withAnswers && answers.trim() ? `${desc.trim()}\nمعلومات إضافية: ${answers.trim()}` : desc;
    if (text.trim().length < 8 && !image) { setError("اكتب وصف المنتج بكلامك (جملة أو اتنين) أو ارفع صورته."); return; }
    if (withAnswers && answers.trim()) { setDesc(text); setAnswers(""); }
    setError(""); setBusy(true);
    ctl.current?.abort();
    ctl.current = new AbortController();
    try {
      const r = await fetch("/api/amazon/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desc: text, brand, image, langs, market }),
        signal: ctl.current.signal,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "حصلت مشكلة. جرّب تاني.");
      setRes(j);
      setTab(j.en ? "en" : "ar");
      requestAnimationFrame(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      if (e?.name !== "AbortError") setError(e.message);
    } finally { setBusy(false); }
  }

  function sendToCheck(l) {
    try { sessionStorage.setItem(CHECK_HANDOFF, JSON.stringify({ ...l, brand })); } catch {}
    router.push("/amazon/check");
  }

  const cur = res?.[tab];

  return (
    <div className={s.body}>
      <section className={s.card} aria-labelledby="ls-h">
        <h2 id="ls-h">قول عن منتجك بكلامك</h2>
        <p className="lead" style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: "0.9rem" }}>زي ما بتحكي لزبون في المحل. من غير تنسيق ولا إنجليزي.</p>

        <div className={s.field}><MarketChips value={market} onChange={setMarket} /></div>

        <div className={s.field}>
          <label className={s.label} htmlFor="ls-desc">
            <span>وصف المنتج</span>
            <button type="button" className={s.miniBtn} onClick={() => setDesc(EXAMPLE)}>جرّب بمثال</button>
          </label>
          <textarea id="ls-desc" className={s.textarea} value={desc} maxLength={2500} onChange={(e) => setDesc(e.target.value)} placeholder="النوع، الخامة، المقاس أو عدد القطع، اللون، بيتستخدم في إيه، وأي ضمان…" />
        </div>

        <div className={s.field}>
          <span className={s.label}><span>صورة المنتج</span><small>اختياري، بتساعدنا نفهم اللون والشكل</small></span>
          <label className={s.upload}>
            <input type="file" accept="image/*" onChange={onImage} aria-label="ارفع صورة المنتج" />
            {image ? <img src={image} alt="" /> : (
              <span className={s.uploadIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.7" /><path d="M20.5 16l-5-4.5L8 19" /></svg>
              </span>
            )}
            <span><b>{image ? "الصورة جاهزة" : "ارفع صورة المنتج"}</b><small>{image ? "اضغط عشان تغيّرها" : "JPG أو PNG من موبايلك"}</small></span>
            {image && <button type="button" className={s.uploadX} onClick={(e) => { e.preventDefault(); setImage(""); }} aria-label="شيل الصورة">×</button>}
          </label>
        </div>

        <div className={s.row2}>
          <div className={s.field}>
            <label className={s.label} htmlFor="ls-brand"><span>اسم البراند</span><small>لو عندك</small></label>
            <input id="ls-brand" className={s.input} value={brand} maxLength={60} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className={s.field}>
            <span className={s.label}><span>اللغة</span></span>
            <div className={s.chips} role="group" aria-label="لغة الليستنج">
              {Object.entries(LANGS).map(([k, v]) => <button key={k} type="button" className={s.chip} aria-pressed={langs === k} onClick={() => setLangs(k)}>{v}</button>)}
            </div>
          </div>
        </div>

        <button type="button" className={s.cta} onClick={() => run(false)} disabled={busy || (desc.trim().length < 8 && !image)}>
          {busy ? <><span className={s.spin} aria-hidden="true" />بنكتب الليستنج…</> : "اكتبلي الليستنج"}
        </button>
        <p className={s.ctaNote}>الكتابة بتاخد من 20 لـ 40 ثانية، ومحدش غيرك بيشوف النتيجة.</p>
        {error && <p className={s.err} role="alert">{error}</p>}
      </section>

      {res && (
        <section className={s.card} ref={resRef} aria-labelledby="ls-r">
          <div className={a.stack}>
            <h2 id="ls-r" style={{ margin: 0 }}>الليستنج جاهز</h2>
            {res.understood && <p className={s.note}><span aria-hidden="true">🧠</span><span><b>فهمنا المنتج كده:</b> {res.understood}</span></p>}

            {res.missing?.length > 0 && (
              <div className={a.stack} style={{ gap: 8 }}>
                <b style={{ fontSize: "0.92rem" }}>معلومات لو ضفتها الليستنج هيبقى أقوى:</b>
                <div className={a.chipsRow}>{res.missing.map((m) => <span key={m} className={`${a.pill} ${a.pillWarn}`}>{m}</span>)}</div>
                <div className={a.row}>
                  <input className={`${s.input} ${a.grow}`} value={answers} onChange={(e) => setAnswers(e.target.value)} placeholder="اكتب إجاباتك هنا، مثلاً: الخامة ستانلس والمقاس 28 سم" aria-label="إجابات المعلومات الناقصة" />
                  <button type="button" className={s.miniBtn} onClick={() => run(true)} disabled={busy || !answers.trim()}>أعد الكتابة</button>
                </div>
              </div>
            )}

            {res.invented?.length > 0 && (
              <p className={s.err} role="alert"><b>راجع الأرقام:</b> {res.invented.join("، ")} ظهرت في الليستنج ومش مكتوبة في كلامك. تأكد منها أو شيلها.</p>
            )}

            {res.en && res.ar && (
              <div className={a.tabs} role="tablist" aria-label="اللغة">
                <button role="tab" type="button" aria-selected={tab === "en"} onClick={() => setTab("en")}>English</button>
                <button role="tab" type="button" aria-selected={tab === "ar"} onClick={() => setTab("ar")}>العربي</button>
              </div>
            )}

            {cur && (
              <div className={a.stack} role="tabpanel">
                <StatusBanner status={cur.check.status} stats={cur.check.stats} />
                {cur.repaired && <p className={a.hint} style={{ margin: 0 }}>كان فيه مخالفات في أول نسخة واتصلحت تلقائياً.</p>}
                <ListingView
                  listing={cur.listing}
                  extraActions={<button type="button" className={s.miniBtn} onClick={() => sendToCheck(cur.listing)}>افحصه في فاحص الرفض</button>}
                />
                {cur.check.issues.length > 0 && (
                  <details className={a.details}>
                    <summary>ملاحظات الفحص ({cur.check.issues.length})</summary>
                    <IssueList issues={cur.check.issues} limit={6} />
                  </details>
                )}
              </div>
            )}
            <p className={a.hint}>راجع الليستنج مع منتجك الفعلي قبل النشر. أمازون هي اللي بتقرر القبول، وفئات زي الكهربا والمستحضرات والأغذية ليها اشتراطات خاصة.</p>
          </div>
        </section>
      )}
    </div>
  );
}
