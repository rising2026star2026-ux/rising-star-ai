"use client";
// «تحليل المنافس»: التاجر بيلصق ليستنج المنافس وتقييماته. إحنا مش بنسحب صفحات أمازون ولا بنخمّن أرقام مبيعات.
// كل اقتباس بيظهر كدليل بيتراجع بالكود على النص اللي لصقته، واللي مش موجود بيتشال.
import { useEffect, useRef, useState } from "react";
import { MarketChips, CopyBlock } from "./shared";
import { ICONS } from "./icons";
import s from "../seller/seller.module.css";
import a from "./amazon.module.css";

const MIN_REVIEWS = 80;

export default function CompetitorTool() {
  const [market, setMarket] = useState("eg");
  const [listing, setListing] = useState("");
  const [reviews, setReviews] = useState("");
  const [mine, setMine] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState(null);
  const ctl = useRef(null);
  const resRef = useRef(null);
  useEffect(() => () => ctl.current?.abort(), []);

  const ready = listing.trim().length >= 20 && reviews.trim().length >= MIN_REVIEWS;

  async function run() {
    setError(""); setBusy(true); setRes(null);
    ctl.current?.abort();
    ctl.current = new AbortController();
    try {
      const r = await fetch("/api/amazon/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing, reviews, mine, market }),
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

  return (
    <div className={s.body}>
      <section className={s.card} aria-labelledby="cp-h">
        <h2 id="cp-h">الصق بيانات المنافس</h2>
        <p className="lead" style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: "0.9rem" }}>افتح صفحة منتج المنافس على أمازون، وانسخ النص بإيدك.</p>
        <div className={s.field}><MarketChips value={market} onChange={setMarket} /></div>

        <div className={s.field}>
          <label className={s.label} htmlFor="cp-l"><span>1) عنوان ونقاط المنافس</span></label>
          <textarea id="cp-l" className={s.textarea} style={{ minHeight: 120 }} value={listing} maxLength={4000} onChange={(e) => setListing(e.target.value)} placeholder="انسخ العنوان والنقاط من صفحة المنتج" />
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="cp-r"><span>2) تقييمات عملائه</span><small>{reviews.length} حرف</small></label>
          <textarea id="cp-r" className={s.textarea} style={{ minHeight: 170 }} value={reviews} maxLength={9000} onChange={(e) => setReviews(e.target.value)} placeholder="انسخ 10 تقييمات أو أكتر. الأهم التقييمات من نجمة لـ3 نجوم، لأنها بتقولك المنافس بيغلط في إيه." />
          <p className={a.hint}>كل ما لصقت تقييمات أكتر النتيجة أدق. {reviews.length > 0 && reviews.length < MIN_REVIEWS ? "التقييمات قليلة، ضيف أكتر." : ""}</p>
        </div>

        <details className={a.details}>
          <summary>ليستنج منتجك (اختياري)</summary>
          <p className={a.hint} style={{ marginTop: 0 }}>لو لصقته هنقولك الكلمات الناقصة عندك واللي موجودة عند المنافس، ونكتب لك نقاط تعالج شكاوي عملائه.</p>
          <textarea className={s.textarea} aria-label="ليستنج منتجك" value={mine} maxLength={2500} onChange={(e) => setMine(e.target.value)} />
        </details>

        <div style={{ marginTop: 16 }}>
          <button type="button" className={`${s.cta} ${s.blue}`} onClick={run} disabled={busy || !ready}>
            {busy ? <><span className={`${s.spin} ${s.spinLight}`} aria-hidden="true" />بنحلل…</> : "حلّل المنافس"}
          </button>
          <p className={s.ctaNote}>التحليل بيعتمد على اللي لصقته بس، ومش بنخمّن أرقام مبيعات.</p>
          {error && <p className={s.err} role="alert">{error}</p>}
        </div>
      </section>

      {res && (
        <section className={s.card} ref={resRef} aria-labelledby="cp-r-h">
          <div className={a.stack}>
            <h2 id="cp-r-h" style={{ margin: 0 }}>فرصتك قدام المنافس</h2>
            {res.summary && <p className={s.note}><span aria-hidden="true">{ICONS.search}</span><span>{res.summary}</span></p>}
            {res.reviewsLen < 600 && <p className={a.hint} style={{ margin: 0 }}>التقييمات اللي لصقتها قليلة، فاعتبر الاستنتاجات مؤشر مش حكم.</p>}

            <div className={a.stack} style={{ gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: "1rem" }}>نقاط ضعفه اللي تقدر تتفوق بيها</h3>
              {res.painPoints.map((p, i) => (
                <article key={i} className={a.pain}>
                  <h3>{p.issue}<span className={a.freq}>{p.frequency} (تقدير)</span></h3>
                  {p.quote ? (
                    <blockquote className={a.quote} dir="auto">«{p.quote}»<small>✓ موجود في التقييمات اللي لصقتها</small></blockquote>
                  ) : (
                    <p className={a.hint} style={{ margin: 0 }}>استنتاج من مجمل التقييمات، من غير اقتباس مباشر.</p>
                  )}
                  {p.howToWin && <p className={a.win}><b>إزاي تستغلها:</b> {p.howToWin}</p>}
                </article>
              ))}
            </div>

            {res.strengths.length > 0 && (
              <div className={a.stack} style={{ gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>اللي عملاؤه بيحبوه فيه</h3>
                <ul className={a.issues}>
                  {res.strengths.map((x, i) => (
                    <li key={i} className={`${a.issue} ${a.lv_tip}`}><span className={a.tag}>قوة</span><span><b>{x.point}</b>{x.answer ? ` ← ${x.answer}` : ""}</span></li>
                  ))}
                </ul>
              </div>
            )}

            {res.angles.length > 0 && (
              <div className={a.stack} style={{ gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>زوايا بيع تقدر تمشي عليها</h3>
                <div className={a.chipsRow}>{res.angles.map((x) => <span key={x} className={`${a.pill} ${a.pillAi}`}>{x}</span>)}</div>
              </div>
            )}

            {res.keywordGaps.length > 0 && (
              <div className={a.stack} style={{ gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>كلمات عنده وناقصة عندك</h3>
                <div className={a.chipsRow}>{res.keywordGaps.map((x) => <span key={x} className={a.pill} dir="auto">{x}</span>)}</div>
              </div>
            )}

            {res.bullets.length > 0 && (
              <div className={a.stack} style={{ gap: 8 }}>
                <CopyBlock label="نقاط مقترحة لمنتجك" text={res.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")} />
                <p className={a.hint} style={{ margin: 0 }}>
                  {res.removedBullets > 0 ? `اتشالت ${res.removedBullets} نقطة فيها مخالفة لقواعد أمازون. ` : ""}
                  استخدم النقطة بس لو بتنطبق فعلاً على منتجك، ولا تدّعي حاجة مش فيه.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
