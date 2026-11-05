"use client";
// الباحث العقاري: 3 أجزاء في صفحة واحدة.
//   1) الباحث: منطقة ونوع وهدف ← أسعار المتر والإيجار من الإعلانات والخدمات القريبة ← حسابات (تقسيط، كاش، إيجار، عائد) ← تقرير.
//   2) الحاسبات: تقسيط، عائد إيجاري، الإيجار القديم، ضريبة التصرفات.
//   3) اقرا إعلان أو عقد: صورة أو نص ← بيانات ونقط ناقصة ومقلقة وأسئلة.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Md from "./Md";
import ShareBar from "./ShareBar";
import { read, write, toast } from "@/lib/store";
import { fileToDataUrl } from "@/lib/imagefile";
import {
  PURPOSES, UNIT_TYPES, MODES, REPORT_SECTIONS, DISCLAIMER, OLD_RENT_ZONES, OLD_RENT_LAW,
  installmentPlan, compareOptions, rentalYield, oldRent, transferCosts, factsText, egp, n0, pct,
} from "@/lib/realestate";
import { CRITERIA, GOALS, DEV_TIERS, DOCS, UNIT0, compareUnits } from "@/lib/rescore";
import s from "./realestate.module.css";

const KEY = "realestate-last";
const CMP = "realestate-compare";
const CITIES = ["القاهرة", "الجيزة", "القاهرة الجديدة", "الشيخ زايد", "6 أكتوبر", "العاصمة الإدارية", "الإسكندرية", "العلمين الجديدة", "الساحل الشمالي", "العين السخنة", "المنصورة", "طنطا", "أسيوط", "سوهاج", "المنيا", "بني سويف", "الأقصر", "أسوان", "بورسعيد", "الإسماعيلية", "السويس", "الغردقة", "شرم الشيخ", "دمياط", "الزقازيق"];
const FORM0 = { mode: "sale", type: "apartment", purpose: "live", city: "", district: "", area: "", budget: "", notes: "" };
const EXAMPLES = [
  { label: "شقة 150 متر في التجمع الخامس", f: { mode: "sale", type: "apartment", purpose: "live", city: "القاهرة الجديدة", district: "التجمع الخامس", area: "150", budget: "" } },
  { label: "شقة للإيجار في المعادي", f: { mode: "rent", type: "apartment", purpose: "live", city: "القاهرة", district: "المعادي", area: "120", budget: "" } },
  { label: "استثمار في الشيخ زايد", f: { mode: "sale", type: "apartment", purpose: "invest", city: "الشيخ زايد", district: "", area: "130", budget: "" } },
];

function Chips({ value, options, onChange, label }) {
  return (
    <div className={s.chips} role="group" aria-label={label}>
      {options.map(([id, name]) => (
        <button key={id} type="button" className={`${s.chip} ${value === id ? s.chipOn : ""}`} aria-pressed={value === id} onClick={() => onChange(id)}>{name}</button>
      ))}
    </div>
  );
}

function Num({ label, value, onChange, suffix, step = 1, min = 0, max }) {
  return (
    <label className={s.field}>
      <span className={s.label}>{label}</span>
      <span className={s.numWrap}>
        <input className={s.input} type="number" inputMode="decimal" dir="ltr" value={value} step={step} min={min} max={max} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
        {suffix && <small>{suffix}</small>}
      </span>
    </label>
  );
}

const Kpi = ({ label, value, sub }) => (
  <div className={s.kpi}><span>{label}</span><b>{value}</b>{sub ? <small>{sub}</small> : null}</div>
);

async function streamTo(res, onText) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += dec.decode(value, { stream: true });
    onText(text);
  }
  return text;
}

async function post(body, signal) {
  const r = await fetch("/api/realestate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.error || "حصل خطأ، جرّب تاني.");
  }
  return r;
}

/* ===================== الباحث ===================== */
function Researcher() {
  const [form, setForm] = useState(FORM0);
  const [data, setData] = useState(null);
  const [inp, setInp] = useState(null); // الافتراضات القابلة للتعديل
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const ctlRef = useRef(null);

  useEffect(() => {
    const last = read(KEY, null);
    if (last?.form) setForm({ ...FORM0, ...last.form });
    if (last?.data) setData(last.data);
    if (last?.inp) setInp(last.inp);
    if (last?.report) setReport(last.report);
  }, []);
  useEffect(() => { if (data) write(KEY, { form, data, inp, report }); }, [form, data, inp, report]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setI = (k) => (v) => setInp((x) => ({ ...x, [k]: v }));
  const m = data?.market;
  const sale = data ? data.form.mode === "sale" : form.mode === "sale";

  function defaults(d) {
    const mk = d.market;
    const area = Number(d.form.area) || 120;
    const ppm = mk.salePpm?.mid || (mk.prices?.mid && area ? mk.prices.mid / area : 0);
    const price = d.form.budget && !ppm ? d.form.budget : Math.round((ppm * area) / 10000) * 10000 || d.form.budget || 0;
    const infl = mk.inflation?.value ?? 15;
    return {
      price, rentMonthly: Math.round((mk.rent?.mid || 0) / 100) * 100,
      downPct: 10, years: 7, perYear: 4, maintenancePct: 8, deliveryYears: 3,
      cashDiscountPct: 20, appreciation: Math.round(mk.appreciation?.value ?? Math.max(8, infl - 2)), inflation: infl,
      rentGrowth: 10, savingsReturn: 0, horizon: 7, vacancyMonths: 1, costsYearly: 0,
    };
  }

  const calc = useMemo(() => {
    if (!inp || !data) return null;
    const plan = installmentPlan({ price: inp.price, downPct: inp.downPct, years: inp.years, perYear: inp.perYear, maintenancePct: inp.maintenancePct, deliveryYears: inp.deliveryYears, inflation: inp.inflation });
    const compare = compareOptions({ price: inp.price, cashDiscountPct: inp.cashDiscountPct, plan: { downPct: inp.downPct, years: inp.years, perYear: inp.perYear, maintenancePct: inp.maintenancePct, deliveryYears: inp.deliveryYears }, rentMonthly: inp.rentMonthly, rentGrowth: inp.rentGrowth, appreciation: inp.appreciation, inflation: inp.inflation, savingsReturn: inp.savingsReturn, horizon: inp.horizon });
    const yld = inp.rentMonthly ? rentalYield({ price: inp.price, rentMonthly: inp.rentMonthly, vacancyMonths: inp.vacancyMonths, costsYearly: inp.costsYearly }) : null;
    const costs = transferCosts({ price: inp.price });
    return { price: Number(inp.price) || 0, plan: sale ? plan : null, compare: sale ? compare : null, yield: sale ? yld : null, costs: sale ? costs : null };
  }, [inp, data, sale]);

  async function gather(f = form) {
    if (!f.city.trim() && !f.district.trim()) { setError("اكتب المدينة أو المنطقة."); return; }
    setError(""); setBusy("gather"); setReport(null);
    const ctl = new AbortController(); ctlRef.current = ctl;
    try {
      const r = await post({ step: "gather", form: f }, ctl.signal);
      const d = await r.json();
      setData(d);
      setInp(defaults(d));
    } catch (e) { if (e.name !== "AbortError") setError(e.message); } finally { setBusy(""); ctlRef.current = null; }
  }

  async function writeReport() {
    if (!data || !calc) return;
    setBusy("report"); setError("");
    const ctl = new AbortController(); ctlRef.current = ctl;
    const facts = factsText(data.form, { salePpm: m.salePpm, rent: m.rent, inflation: m.inflation, places: m.places }, calc);
    const secs = REPORT_SECTIONS.filter((x) => sale || x.key !== "payment").map((x) => ({ ...x, text: "", status: "wait" }));
    let rep = { secs, facts };
    setReport(rep);
    try {
      for (let i = 0; i < secs.length; i++) {
        const patch = (p) => { rep = { ...rep, secs: rep.secs.map((x, k) => (k === i ? { ...x, ...p } : x)) }; setReport(rep); };
        patch({ status: "writing" });
        try {
          const r = await post({ step: "section", key: secs[i].key, form: data.form, facts, summary: m.summary, risks: m.risks, sources: data.sources }, ctl.signal);
          const text = await streamTo(r, (t) => patch({ text: t }));
          patch({ status: text.trim() ? "done" : "error" });
        } catch (e) {
          if (e.name === "AbortError") throw e;
          patch({ status: "error" });
        }
      }
    } catch (e) { if (e.name !== "AbortError") setError(e.message); } finally { setBusy(""); ctlRef.current = null; }
  }

  function reset() { setData(null); setInp(null); setReport(null); setError(""); }
  const reportText = report ? `# تقرير عقاري: ${[data?.form.district, data?.form.city].filter(Boolean).join("، ")}\n\n${report.secs.map((x) => x.text).join("\n\n")}\n\n> ${DISCLAIMER}` : "";

  return (
    <div className={s.stack}>
      <section className={s.card} aria-label="طلبك">
        <div className={s.grid2}>
          <div className={s.field}><span className={s.label}>عايز</span><Chips label="عايز" value={form.mode} onChange={set("mode")} options={Object.entries(MODES)} /></div>
          <div className={s.field}><span className={s.label}>الهدف</span><Chips label="الهدف" value={form.purpose} onChange={set("purpose")} options={Object.entries(PURPOSES).map(([k, v]) => [k, v.name])} /></div>
        </div>
        <div className={s.field}><span className={s.label}>نوع الوحدة</span><Chips label="نوع الوحدة" value={form.type} onChange={set("type")} options={Object.entries(UNIT_TYPES)} /></div>
        <div className={s.grid2}>
          <label className={s.field}><span className={s.label}>المدينة</span><input className={s.input} list="re-cities" value={form.city} maxLength={60} onChange={(e) => set("city")(e.target.value)} placeholder="مثلاً: القاهرة الجديدة" /></label>
          <label className={s.field}><span className={s.label}>الحي أو الكمبوند (اختياري)</span><input className={s.input} value={form.district} maxLength={80} onChange={(e) => set("district")(e.target.value)} placeholder="مثلاً: التجمع الخامس" /></label>
          <label className={s.field}><span className={s.label}>المساحة (متر)</span><input className={s.input} type="number" inputMode="numeric" dir="ltr" value={form.area} onChange={(e) => set("area")(e.target.value)} placeholder="120" /></label>
          <label className={s.field}><span className={s.label}>{form.mode === "rent" ? "الإيجار الشهري اللي تقدر عليه" : "الميزانية (اختياري)"}</span><input className={s.input} type="number" inputMode="numeric" dir="ltr" value={form.budget} onChange={(e) => set("budget")(e.target.value)} placeholder={form.mode === "rent" ? "15000" : "5000000"} /></label>
        </div>
        <datalist id="re-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
        <label className={s.field}><span className={s.label}>ملاحظات (اختياري)</span><input className={s.input} value={form.notes} maxLength={400} onChange={(e) => set("notes")(e.target.value)} placeholder="مثلاً: قريب من مدارس، دور أرضي بجنينة، استلام فوري" /></label>
        {!data && (
          <div className={s.examples}>
            {EXAMPLES.map((x) => <button key={x.label} type="button" className={s.example} onClick={() => { const f = { ...FORM0, ...x.f }; setForm(f); gather(f); }}>{x.label}</button>)}
          </div>
        )}
        <div className={s.actions}>
          {busy === "gather"
            ? <button type="button" className={s.stop} onClick={() => ctlRef.current?.abort()}>إيقاف</button>
            : <button type="button" className={s.primary} disabled={!!busy} onClick={() => gather()}>{data ? "دوّر تاني" : "ابدأ البحث"}</button>}
          {data && !busy && <button type="button" className={s.ghost} onClick={reset}>بحث جديد</button>}
        </div>
      </section>

      {busy === "gather" && <div className={s.status}><span className={s.spin} aria-hidden="true" /> بدوّر في مواقع العقارات والأخبار والخرائط…</div>}
      {error && <div className={s.error} role="alert">{error}</div>}

      {data && m && inp && (
        <>
          <section className={s.card} aria-label="السوق">
            <div className={s.head}><b>السوق في {[data.form.district, data.form.city].filter(Boolean).join("، ")}</b><small>{data.sources.length} نتيجة من مواقع العقارات والأخبار</small></div>
            <div className={s.kpis}>
              {m.salePpm && <Kpi label="سعر المتر للبيع" value={`من ${n0(m.salePpm.low)} لـ ${n0(m.salePpm.high)}`} sub={`الوسط ${n0(m.salePpm.mid)} جنيه${m.salePpm.est ? " · تقدير من النتايج" : ` · ${m.salePpm.n} عينة`}`} />}
              {m.rent && <Kpi label="الإيجار الشهري" value={`من ${n0(m.rent.low)} لـ ${n0(m.rent.high)}`} sub={`الوسط ${n0(m.rent.mid)} جنيه${m.rent.est ? " · تقدير" : ` · ${m.rent.n} عينة`}`} />}
              {m.appreciation && <Kpi label="زيادة الأسعار المتوقعة" value={pct(m.appreciation.value)} sub="في السنة · تقدير" />}
              {m.inflation && <Kpi label="التضخم المتوقع" value={pct(m.inflation.value)} sub={`صندوق النقد ${m.inflation.year}`} />}
            </div>
            {!m.salePpm && !m.rent && <p className={s.note}>ما لقيتش أرقام كفاية في النتايج للمنطقة دي. جرّب اسم أوسع (المدينة بدل الكمبوند) أو حط السعر بنفسك تحت.</p>}
            {m.summary && <p className={s.para}>{m.summary}</p>}
            {m.places?.length > 0 && (
              <div className={s.places}>
                {m.places.map((p) => <span key={p.label} className={s.place} title={p.top.join("، ")}><b>{p.count}{p.count >= 10 ? "+" : ""}</b> {p.label}</span>)}
              </div>
            )}
            {m.placesNote && <p className={s.note}>{m.placesNote}</p>}
            <details className={s.srcBox}>
              <summary>المصادر ({data.sources.length})</summary>
              <ol className={s.srcList}>
                {data.sources.map((x) => <li key={x.n}><a href={x.url} target="_blank" rel="noopener noreferrer nofollow">[{x.n}] {x.title}</a><small>{x.site}</small></li>)}
              </ol>
            </details>
          </section>

          <section className={s.card} aria-label="الحسابات">
            <div className={s.head}><b>{sale ? "الحسابات" : "الإيجار"}</b><small>عدّل أي رقم والحسابات بتتغير على طول</small></div>
            <div className={s.grid3}>
              {sale && <Num label="سعر الوحدة" value={inp.price} onChange={setI("price")} suffix="جنيه" step={10000} />}
              <Num label="الإيجار الشهري" value={inp.rentMonthly} onChange={setI("rentMonthly")} suffix="جنيه" step={500} />
              {sale && <Num label="المقدم" value={inp.downPct} onChange={setI("downPct")} suffix="%" max={100} />}
              {sale && <Num label="سنين التقسيط" value={inp.years} onChange={setI("years")} suffix="سنة" max={15} />}
              {sale && (
                <label className={s.field}><span className={s.label}>الأقساط</span>
                  <select className={s.input} value={inp.perYear} onChange={(e) => setI("perYear")(Number(e.target.value))}>
                    <option value={12}>شهرية</option><option value={4}>كل 3 شهور</option><option value={2}>كل 6 شهور</option><option value={1}>سنوية</option>
                  </select>
                </label>
              )}
              {sale && <Num label="وديعة الصيانة" value={inp.maintenancePct} onChange={setI("maintenancePct")} suffix="%" step={0.5} />}
              {sale && <Num label="الاستلام بعد" value={inp.deliveryYears} onChange={setI("deliveryYears")} suffix="سنة" step={0.5} />}
              {sale && <Num label="خصم الكاش المعروض" value={inp.cashDiscountPct} onChange={setI("cashDiscountPct")} suffix="%" />}
              {sale && <Num label="زيادة الأسعار في السنة" value={inp.appreciation} onChange={setI("appreciation")} suffix="%" min={-20} />}
              <Num label="التضخم في السنة" value={inp.inflation} onChange={setI("inflation")} suffix="%" />
              {sale && <Num label="المقارنة على" value={inp.horizon} onChange={setI("horizon")} suffix="سنة" max={20} />}
            </div>
            {sale && calc?.plan && (
              <>
                <div className={s.kpis}>
                  <Kpi label="المقدم" value={egp(calc.plan.down)} />
                  <Kpi label={calc.plan.perYear === 12 ? "القسط الشهري" : "القسط"} value={egp(calc.plan.each)} sub={`${calc.plan.count} قسط`} />
                  <Kpi label="إجمالي اللي هتدفعه" value={egp(calc.plan.total)} sub="مع وديعة الصيانة" />
                  <Kpi label="بقيمة فلوس النهارده" value={egp(calc.plan.realTotal)} sub={`بعد خصم تضخم ${pct(calc.plan.inflation, 0)}`} />
                </div>
                <p className={`${s.verdict} ${inp.cashDiscountPct > calc.plan.breakEvenCashDiscount ? s.good : ""}`}>
                  أي خصم كاش أكبر من <b>{pct(calc.plan.breakEvenCashDiscount)}</b> يخلّي الكاش أوفر من التقسيط بقيمة فلوس النهارده.
                  {" "}{inp.cashDiscountPct > calc.plan.breakEvenCashDiscount ? `الخصم اللي حاطه (${pct(inp.cashDiscountPct, 0)}) أكبر، فالكاش أوفر لو معاك الفلوس.` : `الخصم اللي حاطه (${pct(inp.cashDiscountPct, 0)}) أقل، فالتقسيط أوفر.`}
                </p>
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead><tr><th>بعد {calc.compare.horizon} سنين</th><th>اتدفع (بقيمة النهارده)</th><th>قيمة اللي معاك</th><th>الصافي</th></tr></thead>
                    <tbody>
                      <tr><td>كاش بخصم</td><td>{egp(calc.compare.cash.paid)}</td><td>{egp(calc.compare.cash.endValueReal)}</td><td>{egp(calc.compare.cash.net)}</td></tr>
                      <tr><td>تقسيط</td><td>{egp(calc.compare.installments.paidReal)}</td><td>{egp(calc.compare.installments.endValueReal)}</td><td>{egp(calc.compare.installments.net)}</td></tr>
                      {calc.compare.rent && <tr><td>إيجار وتحويش التمن</td><td>{egp(calc.compare.rent.paidReal)} إيجار</td><td>{egp(calc.compare.rent.savedReal)}</td><td>{egp(calc.compare.rent.net)}</td></tr>}
                    </tbody>
                  </table>
                </div>
                <p className={s.note}>قيمة الوحدة بعد {calc.compare.horizon} سنين متوقعة {egp(calc.compare.futureValue)} لو الأسعار زادت {pct(inp.appreciation, 0)} في السنة. الصافي = قيمة اللي معاك في الآخر ناقص اللي دفعته، والكل بقيمة فلوس النهارده. التحويش في الإيجار محسوب من غير فوايد.</p>
                {calc.yield && (
                  <div className={s.kpis}>
                    <Kpi label="العائد الإيجاري الإجمالي" value={pct(calc.yield.gross)} sub="في السنة" />
                    <Kpi label="العائد الصافي" value={pct(calc.yield.net)} sub={`بعد ${inp.vacancyMonths} شهر فاضي`} />
                    <Kpi label="الإيجار يرجّع التمن في" value={Number.isFinite(calc.yield.paybackYears) ? `${calc.yield.paybackYears.toFixed(1)} سنة` : "—"} />
                    <Kpi label="ضريبة التصرفات (على البايع)" value={egp(calc.costs.disposalTax)} sub="2.5% من السعر" />
                  </div>
                )}
              </>
            )}
            {!sale && (
              <div className={s.kpis}>
                <Kpi label="الإيجار في السنة" value={egp((Number(inp.rentMonthly) || 0) * 12)} />
                <Kpi label="بعد سنة لو زاد 10%" value={egp((Number(inp.rentMonthly) || 0) * 1.1)} sub="في الشهر" />
                {data.form.budget ? <Kpi label="ميزانيتك" value={egp(data.form.budget)} sub={Number(inp.rentMonthly) > data.form.budget ? "أقل من وسط السوق" : "في حدود السوق"} /> : null}
              </div>
            )}
            <div className={s.actions}>
              {busy === "report"
                ? <button type="button" className={s.stop} onClick={() => ctlRef.current?.abort()}>إيقاف</button>
                : <button type="button" className={s.primary} disabled={!!busy} onClick={writeReport}>{report ? "اكتب التقرير من جديد" : "اكتب التقرير"}</button>}
            </div>
          </section>
        </>
      )}

      {report && (
        <section className={`${s.card} ${s.report}`} aria-label="التقرير">
          <div id="re-report">
          {report.secs.map((x) => (
            <div key={x.key} className={s.sec}>
              {x.text ? <Md>{x.text}</Md> : x.status === "writing" ? <div className={s.status}><span className={s.spin} aria-hidden="true" /> بكتب «{x.title}»…</div> : x.status === "error" ? <p className={s.error}>قسم «{x.title}» ما اتكتبش. اكتب التقرير من جديد.</p> : null}
            </div>
          ))}
          </div>
          <p className={s.disclaimer}>{DISCLAIMER}</p>
          {!busy && (
            <>
              <Link href="/realestate/chat" className="chat-jump"><span aria-hidden="true">💬</span> ناقش التقرير في الشات العقاري<small>اسأل عن المنطقة والسعر والعقد والتفاوض</small></Link>
              <ShareBar text={reportText} title="تقرير عقاري" getHtml={() => {
                const esc = (x) => String(x).replace(/[<>&]/g, "");
                const where = [data?.form.district, data?.form.city].filter(Boolean).join("، ");
                const facts = factsText(data.form, { salePpm: m.salePpm, rent: m.rent, inflation: m.inflation, places: m.places }, calc).split("\n").map((l) => `<li>${esc(l)}</li>`).join("");
                const srcs = data.sources.map((x) => `<li><a href="${esc(x.url)}">[${x.n}] ${esc(x.title)}</a> — ${esc(x.site)}</li>`).join("");
                return `<h1>تقرير عقاري: ${esc(where)}</h1><h2>الأرقام المحسوبة</h2><ul>${facts}</ul>${document.getElementById("re-report")?.innerHTML || ""}<h2>المصادر</h2><ol>${srcs}</ol><p>${esc(DISCLAIMER)}</p>`;
              }} />
            </>
          )}
        </section>
      )}
    </div>
  );
}

/* ===================== المقارنة والتقييم من 100 ===================== */
function Compare() {
  const [units, setUnits] = useState([{ ...UNIT0, name: "وحدة 1" }, { ...UNIT0, name: "وحدة 2" }]);
  const [median, setMedian] = useState("");
  const [goal, setGoal] = useState("live");
  const [weights, setWeights] = useState(() => Object.fromEntries(Object.entries(GOALS).map(([k, v]) => [k, { ...v.w }])));
  const [showW, setShowW] = useState(false);

  useEffect(() => {
    const saved = read(CMP, null);
    if (saved?.units?.length) setUnits(saved.units.map((u) => ({ ...UNIT0, ...u })));
    if (saved?.median) setMedian(saved.median);
    else {
      const last = read(KEY, null);
      const mid = last?.data?.market?.salePpm?.mid;
      if (mid) setMedian(Math.round(mid));
    }
    if (saved?.weights) setWeights((w) => ({ ...w, ...saved.weights }));
  }, []);
  useEffect(() => { write(CMP, { units, median, weights }); }, [units, median, weights]);

  const res = compareUnits(units, median, weights);
  const setU = (i, k) => (v) => setUnits((L) => L.map((u, j) => (j === i ? { ...u, [k]: v } : u)));
  const name = (i) => units[i]?.name || `وحدة ${i + 1}`;

  return (
    <div className={s.stack}>
      <section className={s.card}>
        <div className={s.head}><b>قارن لحد 4 وحدات</b><small>التقييم بالكود من 6 معايير · أي بيانات ناقصة بتتشال من الحساب</small></div>
        <Num label="متوسط سعر المتر في المنطقة" value={median} onChange={setMedian} suffix="جنيه" step={500} />
        <p className={s.note}>{median ? "ده المرجع اللي بنقارن بيه سعر متر كل وحدة. لو جاي من الباحث، ده وسط أسعار الإعلانات." : "دوّر الأول في الباحث العقاري عن المنطقة، أو اكتب متوسط سعر المتر بنفسك، عشان معيار السعر يتحسب."}</p>
        <div className={s.units}>
          {units.map((u, i) => (
            <div key={i} className={s.unit}>
              <div className={s.unitHead}>
                <input className={`${s.input} ${s.unitName}`} value={u.name} maxLength={60} onChange={(e) => setU(i, "name")(e.target.value)} aria-label={`اسم الوحدة ${i + 1}`} />
                {units.length > 2 && <button type="button" className={s.ghost} onClick={() => setUnits((L) => L.filter((_, j) => j !== i))}>شيل</button>}
              </div>
              <div className={s.grid2}>
                <Num label="السعر" value={u.price} onChange={setU(i, "price")} suffix="جنيه" step={10000} />
                <Num label="المساحة" value={u.area} onChange={setU(i, "area")} suffix="متر" />
                <Num label="الإيجار المتوقع" value={u.rent} onChange={setU(i, "rent")} suffix="في الشهر" step={500} />
                <Num label="الاستلام بعد" value={u.delivery} onChange={setU(i, "delivery")} suffix="سنة" step={0.5} />
              </div>
              <label className={s.field}><span className={s.label}>الموقع والخدمات</span>
                <select className={s.input} value={u.location} onChange={(e) => setU(i, "location")(e.target.value)}>
                  <option value="">مش متأكد</option><option value="5">ممتاز</option><option value="4">كويس جداً</option><option value="3">متوسط</option><option value="2">بعيد شوية</option><option value="1">ضعيف</option>
                </select>
              </label>
              <label className={s.field}><span className={s.label}>المطوّر</span>
                <select className={s.input} value={u.developer} onChange={(e) => setU(i, "developer")(e.target.value)}>
                  {Object.entries(DEV_TIERS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </label>
              <label className={s.field}><span className={s.label}>سهولة إعادة البيع</span>
                <select className={s.input} value={u.resale} onChange={(e) => setU(i, "resale")(e.target.value)}>
                  <option value="">مش متأكد</option><option value="5">سهلة جداً (طلب عالي)</option><option value="4">سهلة</option><option value="3">متوسطة</option><option value="2">صعبة</option><option value="1">صعبة جداً</option>
                </select>
              </label>
              <label className={s.field}><span className={s.label}>الأوراق</span>
                <select className={s.input} value={u.docs} onChange={(e) => setU(i, "docs")(e.target.value)}>
                  {Object.entries(DOCS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </label>
              <label className={s.check}><input type="checkbox" checked={!!u.offPlan} onChange={(e) => setU(i, "offPlan")(e.target.checked)} /> بيع على الخريطة (لسه ما اتبنتش)</label>
              {u.url && <a className={s.unitLink} href={u.url} target="_blank" rel="noopener noreferrer nofollow">رابط الإعلان</a>}
            </div>
          ))}
        </div>
        <div className={s.actions}>
          {units.length < 4 && <button type="button" className={s.ghost} onClick={() => setUnits((L) => [...L, { ...UNIT0, name: `وحدة ${L.length + 1}` }])}>ضيف وحدة</button>}
          <button type="button" className={s.ghost} onClick={() => setShowW((v) => !v)} aria-expanded={showW}>{showW ? "اقفل الأوزان" : "عدّل أوزان المعايير"}</button>
        </div>
        {showW && (
          <div className={s.field}>
            <Chips label="الهدف" value={goal} onChange={setGoal} options={Object.entries(GOALS).map(([k, v]) => [k, v.name])} />
            <div className={s.grid3}>
              {Object.entries(CRITERIA).map(([k, l]) => <Num key={k} label={l} value={weights[goal][k]} suffix="%" onChange={(v) => setWeights((W) => ({ ...W, [goal]: { ...W[goal], [k]: Number(v) || 0 } }))} />)}
            </div>
            <button type="button" className={s.ghost} onClick={() => setWeights((W) => ({ ...W, [goal]: { ...GOALS[goal].w } }))}>رجّع الأوزان الأصلية</button>
          </div>
        )}
      </section>

      <section className={s.card} aria-label="النتيجة">
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>المعيار</th>{units.map((_, i) => <th key={i}>{name(i)}</th>)}</tr></thead>
            <tbody>
              <tr><td>سعر المتر</td>{res.rows.map((r, i) => <td key={i}>{r.ppm ? `${n0(r.ppm)} جنيه` : "—"}</td>)}</tr>
              <tr><td>العائد الصافي</td>{res.rows.map((r, i) => <td key={i}>{r.yieldNet != null ? pct(r.yieldNet) : "—"}</td>)}</tr>
              {Object.entries(CRITERIA).map(([k, l]) => <tr key={k}><td>{l}</td>{res.rows.map((r, i) => <td key={i}>{r.scores[k] != null ? Math.round(r.scores[k]) : "مش معروف"}</td>)}</tr>)}
              {Object.entries(GOALS).map(([g, v]) => (
                <tr key={g} className={s.totalRow}><td>{v.name}</td>{res.rows.map((r, i) => <td key={i}><b>{r.goals[g].total ?? "—"}</b>{r.goals[g].total != null ? <small> / 100 · تغطية {r.goals[g].coverage}%</small> : null}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={s.recs}>
          {Object.entries(GOALS).map(([g, v]) => {
            const i = res.best[g];
            if (i < 0) return <div key={g} className={s.rec}><b>{v.name}</b><p className={s.note}>البيانات مش كفاية لسه.</p></div>;
            const r = res.rows[i].goals[g];
            return (
              <div key={g} className={s.rec}>
                <span className={s.recGoal}>{v.name}</span>
                <b>{name(i)} · {r.total}/100</b>
                {r.strong.length > 0 && <p className={s.good2}>أقوى نقطة: {r.strong.map((k) => CRITERIA[k]).join("، ")}</p>}
                {r.weak.length > 0 && <p className={s.bad}>أضعف نقطة: {r.weak.map((k) => CRITERIA[k]).join("، ")}</p>}
                {r.coverage < 70 && <p className={s.note}>التغطية {r.coverage}% بس: كمّل بيانات الوحدات عشان الترشيح يبقى أدق.</p>}
              </div>
            );
          })}
        </div>
        <p className={s.disclaimer}>التقييم بيقارن الوحدات اللي كتبتها ببعض وبمتوسط المنطقة، بالأوزان اللي قدامك. ده مش تقييم عقاري معتمد ولا ضمان لأي ربح.</p>
      </section>
    </div>
  );
}

/* ===================== الحاسبات ===================== */
function Calculators() {
  const [tab, setTab] = useState("plan");
  const [p, setP] = useState({ price: 5000000, downPct: 10, years: 7, perYear: 4, maintenancePct: 8, deliveryYears: 3, inflation: 15, cash: 20 });
  const [y, setY] = useState({ price: 5000000, rent: 20000, vacancy: 1, costs: 10000, furnishing: 0 });
  const [o, setO] = useState({ zone: "mid", current: 40 });
  const [t, setT] = useState({ price: 5000000, commission: 2.5 });
  const plan = installmentPlan(p);
  const yld = rentalYield({ price: y.price, rentMonthly: y.rent, vacancyMonths: y.vacancy, costsYearly: y.costs, furnishing: y.furnishing });
  const old = oldRent(o);
  const tc = transferCosts({ price: t.price, commissionPct: t.commission });
  const up = (fn) => (k) => (v) => fn((x) => ({ ...x, [k]: v }));
  const P = up(setP), Y = up(setY), O = up(setO), T = up(setT);

  return (
    <div className={s.stack}>
      <Chips label="الحاسبة" value={tab} onChange={setTab} options={[["plan", "تقسيط المطوّر"], ["yield", "العائد الإيجاري"], ["old", "الإيجار القديم"], ["tax", "ضريبة التصرفات والعمولة"]]} />
      {tab === "plan" && (
        <section className={s.card}>
          <div className={s.grid3}>
            <Num label="سعر الوحدة" value={p.price} onChange={P("price")} suffix="جنيه" step={10000} />
            <Num label="المقدم" value={p.downPct} onChange={P("downPct")} suffix="%" />
            <Num label="سنين التقسيط" value={p.years} onChange={P("years")} suffix="سنة" />
            <label className={s.field}><span className={s.label}>الأقساط</span>
              <select className={s.input} value={p.perYear} onChange={(e) => P("perYear")(Number(e.target.value))}><option value={12}>شهرية</option><option value={4}>كل 3 شهور</option><option value={2}>كل 6 شهور</option><option value={1}>سنوية</option></select>
            </label>
            <Num label="وديعة الصيانة" value={p.maintenancePct} onChange={P("maintenancePct")} suffix="%" step={0.5} />
            <Num label="الاستلام بعد" value={p.deliveryYears} onChange={P("deliveryYears")} suffix="سنة" step={0.5} />
            <Num label="التضخم المتوقع" value={p.inflation} onChange={P("inflation")} suffix="%" />
            <Num label="خصم الكاش المعروض" value={p.cash} onChange={P("cash")} suffix="%" />
          </div>
          <div className={s.kpis}>
            <Kpi label="المقدم" value={egp(plan.down)} />
            <Kpi label="القسط" value={egp(plan.each)} sub={`${plan.count} قسط`} />
            <Kpi label="إجمالي مع الصيانة" value={egp(plan.total)} />
            <Kpi label="بقيمة فلوس النهارده" value={egp(plan.realTotal)} />
          </div>
          <p className={`${s.verdict} ${p.cash > plan.breakEvenCashDiscount ? s.good : ""}`}>خصم الكاش المعادل: <b>{pct(plan.breakEvenCashDiscount)}</b>. {p.cash > plan.breakEvenCashDiscount ? "الخصم المعروض أكبر، فالكاش أوفر." : "الخصم المعروض أقل، فالتقسيط أوفر بقيمة فلوس النهارده."}</p>
          <div className={s.tableWrap}>
            <table className={s.table}><thead><tr><th>نهاية السنة</th><th>اللي اتدفع لحد كده</th></tr></thead>
              <tbody>{plan.schedule.map((r) => <tr key={r.year}><td>{r.year}</td><td>{egp(r.paid)}</td></tr>)}</tbody></table>
          </div>
        </section>
      )}
      {tab === "yield" && (
        <section className={s.card}>
          <div className={s.grid3}>
            <Num label="سعر الوحدة" value={y.price} onChange={Y("price")} suffix="جنيه" step={10000} />
            <Num label="الإيجار الشهري" value={y.rent} onChange={Y("rent")} suffix="جنيه" step={500} />
            <Num label="شهور فاضية في السنة" value={y.vacancy} onChange={Y("vacancy")} suffix="شهر" max={12} />
            <Num label="مصاريف سنوية (صيانة وغيره)" value={y.costs} onChange={Y("costs")} suffix="جنيه" step={1000} />
            <Num label="فرش وتجهيز" value={y.furnishing} onChange={Y("furnishing")} suffix="جنيه" step={5000} />
          </div>
          <div className={s.kpis}>
            <Kpi label="العائد الإجمالي" value={pct(yld.gross)} />
            <Kpi label="العائد الصافي" value={pct(yld.net)} />
            <Kpi label="الدخل الصافي في السنة" value={egp(yld.netYear)} />
            <Kpi label="يرجّع التمن في" value={Number.isFinite(yld.paybackYears) ? `${yld.paybackYears.toFixed(1)} سنة` : "—"} />
          </div>
        </section>
      )}
      {tab === "old" && (
        <section className={s.card}>
          <div className={s.field}><span className={s.label}>نوع المنطقة أو الوحدة</span><Chips label="المنطقة" value={o.zone} onChange={O("zone")} options={Object.entries(OLD_RENT_ZONES).map(([k, v]) => [k, v.name])} /></div>
          <Num label="الإيجار القديم قبل القانون" value={o.current} onChange={O("current")} suffix="جنيه" />
          <div className={s.kpis}>
            <Kpi label="الإيجار الجديد" value={egp(old.base)} sub={`${old.zone.mult} أضعاف${old.zone.min ? `، وحد أدنى ${n0(old.zone.min)}` : ""}`} />
            <Kpi label="الزيادة السنوية" value={pct(OLD_RENT_LAW.increase, 0)} sub="تراكمية على آخر قيمة" />
            <Kpi label="نهاية الفترة الانتقالية" value={`أغسطس ${old.endYear}`} sub={`${old.zone.years} سنين`} />
          </div>
          <div className={s.tableWrap}>
            <table className={s.table}><thead><tr><th>الفترة</th><th>الإيجار الشهري</th></tr></thead>
              <tbody>{old.rows.map((r) => <tr key={r.year}><td>{r.label}</td><td>{egp(r.rent)}</td></tr>)}</tbody></table>
          </div>
          <p className={s.note}>حسب {OLD_RENT_LAW.name}: لحد ما لجان الحصر تحدد تصنيف المنطقة، بيتدفع إيجار مؤقت {n0(OLD_RENT_LAW.provisional)} جنيه. أول زيادة سنوية 15% بدأت {OLD_RENT_LAW.firstIncrease}. القانون عليه طعون أمام المحكمة الدستورية، فراجع أي تحديث مع محامي.</p>
        </section>
      )}
      {tab === "tax" && (
        <section className={s.card}>
          <div className={s.grid3}>
            <Num label="سعر البيع" value={t.price} onChange={T("price")} suffix="جنيه" step={10000} />
            <Num label="عمولة السمسار" value={t.commission} onChange={T("commission")} suffix="%" step={0.5} />
          </div>
          <div className={s.kpis}>
            <Kpi label="ضريبة التصرفات العقارية" value={egp(tc.disposalTax)} sub="2.5% على البايع" />
            <Kpi label="العمولة" value={egp(tc.commission)} />
          </div>
          <p className={s.note}>ضريبة التصرفات 2.5% من قيمة البيع حسب المادة 42 من قانون الضريبة على الدخل، وفيه حالات إعفاء. رسوم التسجيل في الشهر العقاري منفصلة وبتتحدد حسب المساحة، فاسأل عنها في مكتب الشهر العقاري.</p>
        </section>
      )}
    </div>
  );
}

/* ===================== اقرا إعلان أو عقد ===================== */
function DocReader() {
  const [kind, setKind] = useState("listing");
  const [images, setImages] = useState([]);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addFiles(list) {
    const files = Array.from(list || []).filter((f) => /^image\//.test(f.type)).slice(0, 4 - images.length);
    const urls = [];
    for (const f of files) { try { urls.push(await fileToDataUrl(f, 1400, 0.85)); } catch {} }
    setImages((x) => [...x, ...urls].slice(0, 4));
  }
  async function run() {
    if (!images.length && !text.trim() && !link.trim()) { setError("ارفع صورة أو الزق النص أو حط رابط."); return; }
    setBusy(true); setError(""); setOut(null);
    try {
      const r = await post({ step: "doc", kind, images, text, url: link.trim() });
      setOut(await r.json());
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const F = out?.fields || {};
  const LABELS = kind === "listing"
    ? [["title", "الإعلان"], ["type", "النوع"], ["city", "المدينة"], ["district", "المنطقة"], ["area", "المساحة (متر)"], ["price", "السعر"], ["pricePerMeter", "سعر المتر"], ["rooms", "الغرف"], ["floor", "الدور"], ["finishing", "التشطيب"], ["delivery", "الاستلام"], ["payment", "الدفع"], ["developer", "المطوّر"]]
    : [["parties", "الأطراف"], ["unit", "الوحدة"], ["price", "السعر"], ["payment", "الدفع"], ["delivery", "التسليم"], ["penalties", "غرامات التأخير"], ["maintenance", "الصيانة"]];
  const fmt = (k, v) => (["price", "pricePerMeter"].includes(k) && Number(v) ? egp(Number(v)) : v);

  return (
    <div className={s.stack}>
      <section className={s.card}>
        <Chips label="نوع المحتوى" value={kind} onChange={(v) => { setKind(v); setOut(null); }} options={[["listing", "إعلان عقار"], ["contract", "عقد بيع أو حجز"]]} />
        <label className={s.drop}>
          <input type="file" accept="image/*" multiple className={s.hidden} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <b>{kind === "listing" ? "ارفع سكرين شوت للإعلان" : "ارفع صور صفحات العقد"}</b>
          <small>لحد 4 صور · الصور بتتصغّر على جهازك ومبنحتفظش بيها</small>
        </label>
        {images.length > 0 && (
          <div className={s.thumbs}>{images.map((u, i) => <span key={i} className={s.thumb}><img src={u} alt={`صورة ${i + 1}`} /><button type="button" aria-label="شيل الصورة" onClick={() => setImages((x) => x.filter((_, k) => k !== i))}>×</button></span>)}</div>
        )}
        {kind === "listing" && <label className={s.field}><span className={s.label}>أو حط رابط الإعلان</span><input className={s.input} dir="ltr" value={link} maxLength={600} onChange={(e) => setLink(e.target.value)} placeholder="https://…" /></label>}
        <label className={s.field}><span className={s.label}>أو الزق النص</span><textarea className={s.input} rows={4} value={text} maxLength={12000} onChange={(e) => setText(e.target.value)} placeholder={kind === "listing" ? "الزق نص الإعلان من الموقع أو الواتساب" : "الزق بنود العقد"} /></label>
        <div className={s.actions}><button type="button" className={s.primary} disabled={busy} onClick={run}>{busy ? "بيقرا…" : kind === "listing" ? "اقرا الإعلان" : "راجع العقد"}</button></div>
      </section>
      {error && <div className={s.error} role="alert">{error}</div>}
      {out && (
        <section className={s.card} aria-label="النتيجة">
          <dl className={s.fields}>{LABELS.filter(([k]) => F[k]).map(([k, l]) => <div key={k}><dt>{l}</dt><dd dir="auto">{fmt(k, F[k])}</dd></div>)}</dl>
          {out.terms?.length > 0 && <><b className={s.sub}>أهم البنود</b><ul className={s.list}>{out.terms.map((x, i) => <li key={i}><b>{x.name}:</b> {x.value}</li>)}</ul></>}
          {out.redFlags?.length > 0 && <><b className={`${s.sub} ${s.bad}`}>حاجات مقلقة</b><ul className={s.list}>{out.redFlags.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
          {out.risky?.length > 0 && <><b className={`${s.sub} ${s.bad}`}>بنود محتاجة مراجعة</b><ul className={s.list}>{out.risky.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
          {out.missing?.length > 0 && <><b className={s.sub}>ناقص</b><ul className={s.list}>{out.missing.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
          {kind === "listing" && F.price && (
            <div className={s.actions}>
              <button type="button" className={s.ghost} onClick={() => {
                const saved = read(CMP, null) || {};
                const list = saved.units?.length ? saved.units : [];
                if (list.length >= 4) { toast("المقارنة فيها 4 وحدات خلاص. شيل واحدة الأول."); return; }
                const blank = list.findIndex((u) => !u.price);
                const unit = { ...UNIT0, name: (F.title || F.district || `وحدة ${list.length + 1}`).slice(0, 60), price: F.price, area: F.area || "", url: link.trim() };
                const next = blank >= 0 ? list.map((u, i) => (i === blank ? unit : u)) : [...list, unit];
                write(CMP, { ...saved, units: next.length >= 2 ? next : [...next, { ...UNIT0, name: "وحدة 2" }] });
                toast("اتضافت للمقارنة. افتح «قارن وحدات».");
              }}>ضيفها للمقارنة</button>
            </div>
          )}
          {out.questions?.length > 0 && <><b className={s.sub}>اسأل قبل ما تدفع</b><ol className={s.list}>{out.questions.map((x, i) => <li key={i}>{x}</li>)}</ol></>}
          <p className={s.disclaimer}>{kind === "contract" ? "دي قراءة مبدئية تساعدك تعرف تسأل إيه، مش استشارة قانونية. راجع العقد مع محامي قبل التوقيع." : "البيانات من الإعلان نفسه. عاين الوحدة واطلب الأوراق قبل أي دفع."}</p>
        </section>
      )}
    </div>
  );
}

export default function RealEstate() {
  const [tab, setTab] = useState("research");
  return (
    <div className={s.stack}>
      <div className={s.tabs} role="tablist" aria-label="أجزاء الباحث العقاري">
        {[["research", "الباحث"], ["compare", "قارن وحدات"], ["calc", "الحاسبات"], ["doc", "إعلان أو عقد"]].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`${s.tab} ${tab === k ? s.tabOn : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      <div hidden={tab !== "research"}><Researcher /></div>
      {tab === "compare" && <Compare />}
      {tab === "calc" && <Calculators />}
      {tab === "doc" && <DocReader />}
    </div>
  );
}
