"use client";
// «منتجي هيبيع؟» — فحص السوق المصري ببيانات حقيقية من أمازون مصر ونون وجوميا وتسوق جوجل.
import { useRef, useState } from "react";
import Link from "next/link";
import s from "./seller.module.css";
import m from "./marketcheck.module.css";

const CHANNELS = [
  { id: "marketplace", title: "ببيع على أمازون أو نون أو جوميا", sub: "عندي حساب بياع أو ناوي أفتح" },
  { id: "facebook", title: "منتج جديد هبيعه على فيسبوك", sub: "بإعلانات ممولة، وأول مرة أنزّله" },
];

const egp = (v) => (v || v === 0 ? `${Number(v).toLocaleString("en")} ج` : "—");
const digits = (v) => String(v).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, "").slice(0, 8);

// [3] → رابط للمصدر رقم 3 في القايمة تحت
function Cited({ text }) {
  const parts = String(text || "").split(/(\[\d+\])/g);
  return parts.map((p, i) => {
    const mm = /^\[(\d+)\]$/.exec(p);
    return mm ? <a key={i} href={`#mk-${mm[1]}`} className={m.cite}>{mm[1]}</a> : <span key={i}>{p}</span>;
  });
}

function PriceBar({ stats, price }) {
  if (!stats.min || !stats.max || stats.max === stats.min) return null;
  const pos = (v) => `${Math.max(0, Math.min(100, ((v - stats.min) / (stats.max - stats.min)) * 100))}%`;
  return (
    <div className={m.bar} aria-hidden="true">
      <span className={m.barBand} style={{ insetInlineStart: pos(stats.p25), insetInlineEnd: `calc(100% - ${pos(stats.p75)})` }} />
      <span className={m.barMid} style={{ insetInlineStart: pos(stats.median) }} />
      {price ? <span className={m.barYou} style={{ insetInlineStart: pos(Math.max(stats.min, Math.min(stats.max, price))) }}><b>سعرك</b></span> : null}
    </div>
  );
}

export default function MarketCheck() {
  const [product, setProduct] = useState("");
  const [channel, setChannel] = useState("marketplace");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [shipping, setShipping] = useState("");
  const [feePct, setFeePct] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState(null);
  const ctrl = useRef(null);
  const out = useRef(null);

  async function run(e) {
    e?.preventDefault();
    if (busy) return;
    if (product.trim().length < 3) { setError("اكتب اسم المنتج الأول."); return; }
    setBusy(true);
    setError("");
    setRes(null);
    ctrl.current = new AbortController();
    try {
      const r = await fetch("/api/market-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, channel, price, cost, shipping, feePct: channel === "marketplace" ? feePct : "" }),
        signal: ctrl.current.signal,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setError(j.error || "حصلت مشكلة. جرّب تاني."); return; }
      setRes(j);
      setTimeout(() => out.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      if (err?.name !== "AbortError") setError("الاتصال اتقطع. جرّب تاني.");
    } finally {
      setBusy(false);
    }
  }

  const st = res?.stats;
  const sc = res?.score;
  const a = res?.analysis;

  return (
    <div className={s.body}>
      <form className={s.card} onSubmit={run}>
        <div className={s.field}>
          <label className={s.label} htmlFor="mk-product">المنتج <small>اسم عام أحسن من اسم موديل</small></label>
          <input id="mk-product" className={s.input} value={product} onChange={(e) => setProduct(e.target.value)} maxLength={120} dir="auto"
            placeholder="مثلاً: سماعة بلوتوث لاسلكية، زيت شعر طبيعي، شنطة ظهر لابتوب" />
        </div>

        <fieldset className={m.channels}>
          <legend className={s.label}>هتبيع فين؟</legend>
          {CHANNELS.map((c) => (
            <label key={c.id} className={`${m.channel} ${channel === c.id ? m.channelOn : ""}`}>
              <input type="radio" name="channel" value={c.id} checked={channel === c.id} onChange={() => setChannel(c.id)} />
              <b>{c.title}</b>
              <small>{c.sub}</small>
            </label>
          ))}
        </fieldset>

        <div className={m.nums}>
          <div className={s.field}>
            <label className={s.label} htmlFor="mk-price">سعر البيع <small>بالجنيه</small></label>
            <input id="mk-price" className={s.input} inputMode="numeric" value={price} onChange={(e) => setPrice(digits(e.target.value))} placeholder="اختياري" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="mk-cost">التكلفة عليك <small>للقطعة</small></label>
            <input id="mk-cost" className={s.input} inputMode="numeric" value={cost} onChange={(e) => setCost(digits(e.target.value))} placeholder="اختياري" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="mk-ship">الشحن <small>للقطعة</small></label>
            <input id="mk-ship" className={s.input} inputMode="numeric" value={shipping} onChange={(e) => setShipping(digits(e.target.value))} placeholder="اختياري" />
          </div>
          {channel === "marketplace" && (
            <div className={s.field}>
              <label className={s.label} htmlFor="mk-fee">عمولة المنصة <small>%</small></label>
              <input id="mk-fee" className={s.input} inputMode="numeric" value={feePct} onChange={(e) => setFeePct(digits(e.target.value).slice(0, 2))} placeholder="من صفحة البياع" />
            </div>
          )}
        </div>

        <button type="submit" className={s.cta} disabled={busy}>{busy ? "بندوّر في السوق..." : "افحص السوق"}</button>
        <p className={s.ctaNote}>{busy ? "بندوّر في أمازون مصر ونون وجوميا. ممكن ياخد لحد دقيقة." : "بندوّر في أمازون مصر ونون وجوميا وتسوق جوجل في مصر."}</p>
        {error && <p className={s.err} role="alert">{error}</p>}
      </form>

      <div ref={out} aria-live="polite">
        {res?.empty && <div className={s.card}><p className={m.empty}>{res.note}</p></div>}

        {st && sc && (
          <>
            <section className={s.card} aria-labelledby="mk-score">
              <h2 id="mk-score">مؤشر فرصة «{res.product}»</h2>
              <div className={m.score}>
                <strong dir="ltr">{sc.low}–{sc.high}</strong>
                <span>من 100</span>
              </div>
              <div className={m.range} aria-hidden="true"><i style={{ insetInlineStart: `${sc.low}%`, width: `${sc.high - sc.low}%` }} /></div>
              <p className={m.disclaimer}>
                ده مؤشر محسوب من بيانات السوق اللي لقيناها ({st.listings} ليستنج، {st.reviewsTotal.toLocaleString("en")} تقييم)، مش وعد بمبيعات.
                المدى بيضيق كل ما البيانات تزيد. قوة البيانات هنا: {sc.evidence}%.
              </p>
              {a?.summary && <p className={m.summary}><Cited text={a.summary} /></p>}
              <ul className={m.factors}>
                {sc.factors.map((f, i) => (
                  <li key={i} className={f.delta > 0 ? m.up : f.delta < 0 ? m.down : m.flat}>
                    <b dir="ltr">{f.delta > 0 ? `+${f.delta}` : f.delta}</b>
                    <span><em>{f.label}:</em> {f.why}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={s.card} aria-labelledby="mk-prices">
              <h2 id="mk-prices">الأسعار في السوق المصري</h2>
              {st.priced ? (
                <>
                  <dl className={m.prices}>
                    <div><dt>أقل سعر</dt><dd>{egp(st.min)}</dd></div>
                    <div><dt>المتوسط</dt><dd>{egp(st.median)}</dd></div>
                    <div><dt>أعلى سعر</dt><dd>{egp(st.max)}</dd></div>
                    {res.inputs.price ? <div className={m.mine}><dt>سعرك</dt><dd>{egp(res.inputs.price)}</dd></div> : null}
                  </dl>
                  <PriceBar stats={st} price={res.inputs.price} />
                  <p className={m.small}>من {st.priced} سعر ظاهر. أغلب الأسعار بين {egp(st.p25)} و{egp(st.p75)}.</p>
                </>
              ) : (
                <p className={m.small}>الأسعار مش ظاهرة في نتايج البحث للمنتج ده. افتح الروابط تحت وشوف الأسعار بنفسك.</p>
              )}
              <table className={m.table}>
                <thead><tr><th scope="col">المتجر</th><th scope="col">ليستنج</th><th scope="col">المتوسط</th><th scope="col">تقييمات</th></tr></thead>
                <tbody>
                  {st.stores.map((x) => (
                    <tr key={x.store}><th scope="row">{x.name}</th><td>{x.listings}</td><td>{egp(x.median)}</td><td>{x.reviews ? x.reviews.toLocaleString("en") : "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>

            {a ? (
              <section className={s.card} aria-labelledby="mk-advice">
                <h2 id="mk-advice">التحليل</h2>
                {a.strengths.length > 0 && <><h3 className={m.h3}>اللي في صالحك</h3><ul className={m.list}>{a.strengths.map((t, i) => <li key={i}><Cited text={t} /></li>)}</ul></>}
                {a.risks.length > 0 && <><h3 className={m.h3}>المخاطر</h3><ul className={m.list}>{a.risks.map((t, i) => <li key={i}><Cited text={t} /></li>)}</ul></>}
                {a.steps.length > 0 && <><h3 className={m.h3}>تعمل إيه قبل ما تبدأ</h3><ol className={m.list}>{a.steps.map((t, i) => <li key={i}><Cited text={t} /></li>)}</ol></>}
                {a.check.length > 0 && <><h3 className={m.h3}>اتأكد منها بنفسك</h3><ul className={m.list}>{a.check.map((t, i) => <li key={i}><Cited text={t} /></li>)}</ul></>}
              </section>
            ) : (
              <div className={s.card}><p className={m.small}>الأرقام فوق جاهزة، بس الشرح ما اكتملش دلوقتي. جرّب تاني بعد دقيقة.</p></div>
            )}

            <section className={s.card} aria-labelledby="mk-sources">
              <h2 id="mk-sources">المصادر ({res.listings.length})</h2>
              <p className={m.small}>
                ليستنجات حقيقية لقيناها {res.checkedAt ? `في ${new Date(res.checkedAt).toLocaleDateString("ar-EG")}` : ""}.
                {res.dropped ? ` شيلنا ${res.dropped} نتيجة مش نفس نوع المنتج.` : ""} الأسعار بتتغير، فافتح الرابط قبل ما تعتمد على سعر.
              </p>
              <ol className={m.sources}>
                {res.listings.map((x) => (
                  <li key={x.n} id={`mk-${x.n}`}>
                    <a href={x.link} target="_blank" rel="noopener noreferrer nofollow" dir="auto">{x.title}</a>
                    <span>{x.storeName}{x.price ? ` • ${egp(x.price)}` : ""}{x.rating ? ` • ${x.rating}★` : ""}{x.reviews ? ` (${x.reviews.toLocaleString("en")})` : ""}</span>
                  </li>
                ))}
              </ol>
            </section>

            <div className={s.next}>
              <Link href="/test-ad" className={s.nextCard}><i aria-hidden="true">👥</i><span><b>جرّب إعلانك على 100 زبون</b><small>بعد ما تتأكد من السوق</small></span></Link>
              <Link href="/amazon" className={s.nextCard}><i aria-hidden="true">🛒</i><span><b>أدوات بياعين أمازون</b><small>ليستنج وحاسبة ربح</small></span></Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
