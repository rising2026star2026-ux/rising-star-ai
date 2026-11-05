"use client";
// الباحث التجاري: مقابلة قصيرة ← بحث السوق والافتراضات (بمصادرها) ← العميل يراجع ويعدّل والأرقام تتحسب فوراً ← تقرير دراسة جدوى
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Md from "./Md";
import ShareBar from "./ShareBar";
import FieldData, { fieldText } from "./FieldData";
import { read, write, toast } from "@/lib/store";
import {
  TYPES, GOVERNORATES, SCENARIOS, REPORT_SECTIONS, MONTHS,
  runAll, sensitivity, financialTables, factsText, egp, n0, pct, monthsText,
} from "@/lib/feasibility";
import s from "./feasibility.module.css";

const EMPTY_FORM = { type: "cafe", activity: "", governorate: "", city: "", area: "", capital: "", size: "", customer: "", notes: "" };
const EXAMPLES = [
  { type: "cafe", activity: "كافيه صغير للشباب", governorate: "سوهاج" },
  { type: "shop", activity: "محل ملابس أطفال", governorate: "الجيزة" },
  { type: "factory", activity: "ورشة تصنيع صابون سائل", governorate: "القليوبية" },
];

async function post(body, signal) {
  const res = await fetch("/api/feasibility", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || "حصل خطأ، جرّب تاني.");
  }
  return res;
}

const toNum = (v) => {
  const x = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(x) ? x : 0;
};

function SrcBadges({ item, sources }) {
  if (item?.est) return <em className={s.est}>تقدير</em>;
  return (
    <>
      {(item?.src || []).map((n) => {
        const src = sources.find((x) => x.n === n);
        return src ? <a key={n} className={s.src} href={src.url} target="_blank" rel="noopener noreferrer nofollow" title={src.title}>[{n}]</a> : null;
      })}
    </>
  );
}

function RangeInputs({ value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: toNum(e.target.value) });
  return (
    <span className={s.range}>
      <input inputMode="decimal" aria-label="أقل" value={value.low || ""} onChange={set("low")} />
      <input inputMode="decimal" aria-label="متوقع" className={s.mid} value={value.mid || ""} onChange={set("mid")} />
      <input inputMode="decimal" aria-label="أعلى" value={value.high || ""} onChange={set("high")} />
    </span>
  );
}

function Group({ title, note, items, sources, onChange }) {
  const update = (i, v) => onChange(items.map((x, k) => (k === i ? v : x)));
  return (
    <div className={s.group}>
      <div className={s.groupHead}><b>{title}</b>{note && <small>{note}</small>}</div>
      <div className={s.rowHead}><span>البند</span><span className={s.range}><i>أقل</i><i>متوقع</i><i>أعلى</i></span></div>
      {items.map((x, i) => (
        <div key={i} className={s.row}>
          <span className={s.name}>
            <input value={x.name} aria-label="اسم البند" onChange={(e) => update(i, { ...x, name: e.target.value })} />
            <span className={s.badges}><SrcBadges item={x} sources={sources} /><button type="button" className={s.del} aria-label={`حذف ${x.name}`} onClick={() => onChange(items.filter((_, k) => k !== i))}>×</button></span>
          </span>
          <RangeInputs value={x} onChange={(v) => update(i, { ...x, ...v })} />
        </div>
      ))}
      <button type="button" className={s.add} onClick={() => onChange([...items, { name: "بند جديد", low: 0, mid: 0, high: 0, src: [], est: true }])}>+ بند</button>
    </div>
  );
}

function CashChart({ res }) {
  const W = 640, H = 220, P = 34;
  const all = SCENARIOS.flatMap((x) => res[x.key].rows.map((r) => r.cum)).concat(SCENARIOS.map((x) => -res[x.key].invest));
  const lo = Math.min(...all, 0), hi = Math.max(...all, 0);
  const X = (m) => P + ((W - 2 * P) * m) / MONTHS;
  const Y = (v) => H - P - ((H - 2 * P) * (v - lo)) / (hi - lo || 1);
  const colors = { pess: "#e5484d", mid: "#1f4dff", opt: "#12a150" };
  return (
    <figure className={s.chart}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="الرصيد التراكمي على 36 شهر للسيناريوهات التلاتة">
        <line x1={P} x2={W - P} y1={Y(0)} y2={Y(0)} stroke="rgba(5,5,16,.25)" strokeDasharray="4 4" />
        {[12, 24, 36].map((m) => (
          <g key={m}>
            <line x1={X(m)} x2={X(m)} y1={P} y2={H - P} stroke="rgba(5,5,16,.07)" />
            <text x={X(m)} y={H - 10} textAnchor="middle" fontSize="11" fill="rgba(5,5,16,.55)">{`شهر ${m}`}</text>
          </g>
        ))}
        {SCENARIOS.map((sc) => {
          const r = res[sc.key];
          const pts = [[0, -r.invest], ...r.rows.map((x) => [x.m, x.cum])].map(([m, v]) => `${X(m).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
          return <polyline key={sc.key} points={pts} fill="none" stroke={colors[sc.key]} strokeWidth={sc.key === "mid" ? 2.5 : 1.6} />;
        })}
      </svg>
      <figcaption>
        {SCENARIOS.map((sc) => <span key={sc.key}><i style={{ background: colors[sc.key] }} />{sc.label}</span>)}
        <span className={s.capNote}>الرصيد التراكمي بعد خصم الاستثمار. لما الخط يعدّي الصفر يبقى رجّعت فلوسك.</span>
      </figcaption>
    </figure>
  );
}

function assumptionsText(a, t) {
  const r = (x) => `${n0(x.low)} / ${n0(x.mid)} / ${n0(x.high)}`;
  return [
    "تكاليف التجهيز (مرة واحدة):",
    ...a.capex.map((x) => `- ${x.name}: ${r(x)} ج${x.est ? " (تقدير)" : x.src.length ? ` [${x.src.join("، ")}]` : ""}`),
    "المصاريف الشهرية الثابتة:",
    ...a.fixed.map((x) => `- ${x.name}: ${r(x)} ج${x.est ? " (تقدير)" : x.src.length ? ` [${x.src.join("، ")}]` : ""}`),
    `${t.priceLabel}: ${r(a.price)} ج. ${t.costLabel}: ${r(a.unitCost)} ج. المبيعات الشهرية عند الاستقرار: ${r(a.units)} ${t.unit}.`,
    `بداية المبيعات ${Math.round(a.rampStart * 100)}٪ وتستقر بعد ${a.rampMonths} شهور. ضريبة ${a.taxPct}٪ من المبيعات.`,
  ].join("\n");
}

function assumptionsLog(a, t, sources) {
  const cite = (x) => (x.est ? "تقدير" : (x.src || []).map((n) => `[${n}]`).join(" ") || "—");
  const row = (name, x) => `| ${name} | ${n0(x.low)} | ${n0(x.mid)} | ${n0(x.high)} | ${cite(x)} |`;
  return [
    "## سجل الافتراضات",
    "",
    "| البند | أقل | متوقع | أعلى | المصدر |",
    "| --- | --- | --- | --- | --- |",
    ...a.capex.map((x) => row(`تجهيز: ${x.name}`, x)),
    ...a.fixed.map((x) => row(`شهري: ${x.name}`, x)),
    row(t.priceLabel, a.price),
    row(t.costLabel, a.unitCost),
    row(`${t.unit} في الشهر`, a.units),
    `| التضخم السنوي ٪ | ${n0(a.inflation)} | ${n0(a.inflation)} | ${n0(a.inflation)} | ${a.inflationSrc?.length ? `[${a.inflationSrc[0]}]` : "تقدير"} |`,
    `| العائد المطلوب (معدل الخصم) ٪ | ${n0(a.discountRate)} | ${n0(a.discountRate)} | ${n0(a.discountRate)} | التضخم + 10 نقط |`,
  ].join("\n");
}

const DISCLAIMER = "دي دراسة جدوى أولية معمولة بالذكاء الاصطناعي من مصادر منشورة وتقديرات، علشان تساعدك تاخد قرار. الأرقام اللي مكتوب جنبها «تقدير» محتاجة تتأكد منها ميدانياً. البنوك وجهات التمويل غالباً بتطلب دراسة من مكتب معتمد.";

export default function Feasibility() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [stage, setStage] = useState("idle"); // idle | gathering | ready | writing | done
  const [data, setData] = useState(null); // { sources, competitors, compNote, apps, queries, market, risks }
  const [a, setA] = useState(null);
  const [report, setReport] = useState(null); // [{key,title,text,status}]
  const [field, setField] = useState(null); // { survey, phone, paste, ads, videos }
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const reportRef = useRef(null);

  useEffect(() => {
    const last = read("feasibility-last", null);
    if (last?.a && last?.data) {
      setForm({ ...EMPTY_FORM, ...last.form });
      setData(last.data);
      setA(last.a);
      setReport(last.report || null);
      setField(last.field || null);
      setStage(last.report ? "done" : "ready");
    }
  }, []);

  // نحفظ آخر دراسة على الجهاز (بعد أي تعديل)
  useEffect(() => {
    if (a && data && stage !== "gathering" && stage !== "writing") write("feasibility-last", { form, data, a, report, field });
  }, [a, data, report, stage, form, field]);

  const t = TYPES[form.type] || TYPES.shop;
  const res = useMemo(() => (a ? runAll(a) : null), [a]);
  const sens = useMemo(() => (a ? sensitivity(a) : []), [a]);
  const busy = stage === "gathering" || stage === "writing";
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function start() {
    if (busy || form.activity.trim().length < 3) return;
    setError("");
    setReport(null);
    setStage("gathering");
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const r = await post({ step: "gather", form: { ...form, capital: toNum(form.capital), size: toNum(form.size) } }, ctl.signal);
      const d = await r.json();
      const { assumptions, ...rest } = d;
      setData({ sources: rest.sources, competitors: rest.competitors, compNote: rest.compNote, apps: rest.apps || [], queries: rest.queries, market: assumptions.market, risks: assumptions.risks });
      setA(assumptions);
      setStage("ready");
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
      setStage(a ? "ready" : "idle");
    } finally {
      abortRef.current = null;
    }
  }

  async function writeReport() {
    if (busy || !a || !res) return;
    setError("");
    setStage("writing");
    const ctl = new AbortController();
    abortRef.current = ctl;
    const secs = REPORT_SECTIONS.map((x) => ({ key: x.key, title: x.title, text: "", status: "wait" }));
    setReport(secs);
    requestAnimationFrame(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    const base = {
      step: "section",
      form: { ...form, capital: toNum(form.capital), size: toNum(form.size) },
      facts: factsText(a, res, sens, { ...form, capital: toNum(form.capital) }),
      assumptionsText: assumptionsText(a, t),
      market: data?.market || "",
      sources: (data?.sources || []).map(({ n, title, snippet }) => ({ n, title, snippet })),
      competitors: data?.competitors || [],
      risks: data?.risks || [],
      field: fieldText(field),
    };
    try {
      for (let i = 0; i < secs.length; i++) {
        const patch = (p) => setReport((r) => r.map((x, k) => (k === i ? { ...x, ...p } : x)));
        patch({ status: "writing" });
        let text = "";
        try {
          const r = await post({ ...base, key: secs[i].key }, ctl.signal);
          const reader = r.body.getReader();
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            text += dec.decode(value, { stream: true });
            patch({ text });
          }
          patch({ status: text.trim() ? "done" : "error" });
        } catch (e) {
          if (e.name === "AbortError") throw e;
          patch({ status: "error" });
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      abortRef.current = null;
      setStage("done");
    }
  }

  async function retry(i) {
    if (busy || !report) return;
    setStage("writing");
    const patch = (p) => setReport((r) => r.map((x, k) => (k === i ? { ...x, ...p } : x)));
    patch({ status: "writing", text: "" });
    let text = "";
    try {
      const r = await post({
        step: "section", key: report[i].key,
        form: { ...form, capital: toNum(form.capital), size: toNum(form.size) },
        facts: factsText(a, res, sens, { ...form, capital: toNum(form.capital) }),
        assumptionsText: assumptionsText(a, t), market: data?.market || "",
        sources: (data?.sources || []).map(({ n, title, snippet }) => ({ n, title, snippet })),
        competitors: data?.competitors || [], risks: data?.risks || [], field: fieldText(field),
      });
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        patch({ text });
      }
      patch({ status: text.trim() ? "done" : "error" });
    } catch (e) {
      patch({ status: "error" });
      toast(e.message);
    } finally {
      setStage("done");
    }
  }

  function reset() {
    abortRef.current?.abort();
    setForm(EMPTY_FORM);
    setData(null);
    setA(null);
    setReport(null);
    setField(null);
    setStage("idle");
    setError("");
    write("feasibility-last", null);
  }

  const upd = (k) => (v) => setA((x) => ({ ...x, [k]: v }));
  const tables = a && res ? financialTables(a, res, sens, form.type) : "";
  const title = `دراسة جدوى أولية: ${form.activity}${form.governorate ? ` في ${form.governorate}` : ""}`;
  const bodyText = report ? report.map((x) => (x.key === "finance" && x.text ? `${x.text.trim()}\n\n${tables}` : x.text.trim())).filter(Boolean).join("\n\n") : "";
  const used = new Set([...bodyText.matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1])));
  const usedSources = (data?.sources || []).filter((x) => used.has(x.n));
  const refsText = usedSources.length ? `\n\n## المصادر\n\n${usedSources.map((x) => `${x.n}. ${x.title} — ${x.url}`).join("\n")}` : "";
  const fullText = report && a ? `# ${title}\n\n${bodyText}\n\n${assumptionsLog(a, t, data?.sources || [])}${refsText}\n\n> ${DISCLAIMER}` : "";
  const capital = toNum(form.capital);
  const progress = report ? report.filter((x) => x.status === "done").length : 0;

  return (
    <div className={s.wrap}>
      <section className={s.card} aria-label="بيانات المشروع">
        <span className={s.label}>نوع المشروع</span>
        <div className={s.types} role="radiogroup" aria-label="نوع المشروع">
          {Object.entries(TYPES).map(([k, v]) => (
            <button key={k} type="button" role="radio" aria-checked={form.type === k} disabled={busy} onClick={() => setForm((f) => ({ ...f, type: k }))}>
              <b>{v.label}</b><small>{v.hint}</small>
            </button>
          ))}
        </div>
        <label className={s.field}>
          <span className={s.label}>النشاط بالتحديد</span>
          <input value={form.activity} onChange={set("activity")} maxLength={120} disabled={busy} placeholder="مثلاً: كافيه صغير للطلبة جنب الجامعة" />
        </label>
        {stage === "idle" && !form.activity && (
          <div className={s.examples}>
            {EXAMPLES.map((x) => <button key={x.activity} type="button" onClick={() => setForm((f) => ({ ...f, ...x }))}>{x.activity} — {x.governorate}</button>)}
          </div>
        )}
        <div className={s.grid}>
          <label className={s.field}>
            <span className={s.label}>المحافظة</span>
            <select value={form.governorate} onChange={set("governorate")} disabled={busy}>
              <option value="">اختار</option>
              {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label className={s.field}><span className={s.label}>المدينة</span><input value={form.city} onChange={set("city")} maxLength={60} disabled={busy} placeholder="مثلاً: طهطا" /></label>
          <label className={s.field}><span className={s.label}>المنطقة أو الشارع</span><input value={form.area} onChange={set("area")} maxLength={80} disabled={busy} placeholder="اختياري" /></label>
          <label className={s.field}><span className={s.label}>رأس المال المتاح (جنيه)</span><input inputMode="numeric" value={form.capital} onChange={set("capital")} disabled={busy} placeholder="مثلاً: 300000" /></label>
          <label className={s.field}><span className={s.label}>المساحة (متر مربع)</span><input inputMode="numeric" value={form.size} onChange={set("size")} disabled={busy} placeholder="اختياري" /></label>
          <label className={s.field}><span className={s.label}>العميل المستهدف</span><input value={form.customer} onChange={set("customer")} maxLength={200} disabled={busy} placeholder="مثلاً: طلبة وشباب" /></label>
        </div>
        <label className={s.field}>
          <span className={s.label}>أي تفاصيل تانية</span>
          <textarea rows={2} value={form.notes} onChange={set("notes")} maxLength={600} disabled={busy} placeholder="اختياري: عندك مكان؟ هتشتغل أونلاين كمان؟ عندك خبرة في المجال؟" />
        </label>
        <div className={s.actions}>
          {busy ? (
            <button type="button" className={s.stop} onClick={() => abortRef.current?.abort()}>إيقاف</button>
          ) : (
            <button type="button" className={s.primary} onClick={start} disabled={form.activity.trim().length < 3}>
              {a ? "ابحث في السوق من جديد" : "ابدأ الدراسة"}
            </button>
          )}
          {a && !busy && <button type="button" className={s.ghost} onClick={reset}>دراسة جديدة</button>}
        </div>
      </section>

      {stage === "gathering" && <div className={s.status}><span className={s.spin} aria-hidden="true" /> بدوّر على أسعار السوق والمنافسين وبجهّز الأرقام… (حوالي دقيقة)</div>}
      {error && <div className={s.error} role="alert">{error}</div>}

      {a && res && (
        <>
          <section className={s.card} aria-label="النتيجة">
            <div className={s.head}><b>النتيجة حسب السيناريوهات</b><small>بتتحسب تاني فوراً لما تعدّل أي رقم تحت</small></div>
            <div className={s.tableWrap}>
              <table className={s.kpi}>
                <thead><tr><th>المؤشر</th>{SCENARIOS.map((x) => <th key={x.key} className={x.key === "mid" ? s.hl : ""}>{x.label}</th>)}</tr></thead>
                <tbody>
                  <tr><td>الاستثمار المطلوب</td>{SCENARIOS.map((x) => <td key={x.key}>{egp(res[x.key].invest)}</td>)}</tr>
                  <tr><td>نقطة التعادل ({t.unit}/شهر)</td>{SCENARIOS.map((x) => <td key={x.key}>{n0(res[x.key].breakEvenUnits)}</td>)}</tr>
                  <tr><td>فترة الاسترداد</td>{SCENARIOS.map((x) => <td key={x.key}>{monthsText(res[x.key].payback)}</td>)}</tr>
                  <tr><td>ربح السنة الأولى</td>{SCENARIOS.map((x) => <td key={x.key} className={res[x.key].years[0].profit < 0 ? s.neg : ""}>{egp(res[x.key].years[0].profit)}</td>)}</tr>
                  <tr><td>ربح السنة التالتة</td>{SCENARIOS.map((x) => <td key={x.key} className={res[x.key].years[2].profit < 0 ? s.neg : ""}>{egp(res[x.key].years[2].profit)}</td>)}</tr>
                  <tr><td>صافي القيمة الحالية</td>{SCENARIOS.map((x) => <td key={x.key} className={res[x.key].npv < 0 ? s.neg : ""}>{egp(res[x.key].npv)}</td>)}</tr>
                  <tr><td>العائد الداخلي السنوي</td>{SCENARIOS.map((x) => <td key={x.key}>{pct(res[x.key].irr)}</td>)}</tr>
                </tbody>
              </table>
            </div>
            {capital > 0 && (
              <p className={capital >= res.mid.invest ? s.ok : s.gap}>
                {capital >= res.mid.invest
                  ? `رأس مالك (${egp(capital)}) مغطي الاستثمار المتوقع.`
                  : `ناقصك ${egp(res.mid.invest - capital)} في السيناريو المتوقع. التقرير هيقترح طرق تمويل من غير قروض بفايدة.`}
              </p>
            )}
            <CashChart res={res} />
            <div className={s.sens}>
              <b>أكتر حاجة بتأثر على مشروعك</b>
              <ol>{sens.slice(0, 3).map((x) => <li key={x.key}>{x.label}: لو اتغير 20٪ صافي القيمة بيتحرك حوالي {egp(x.swing / 2)}</li>)}</ol>
            </div>
          </section>

          <section className={s.card} aria-label="الافتراضات">
            <div className={s.head}><b>الافتراضات</b><small>راجع كل رقم وعدّله من خبرتك. «تقدير» يعني مالقيناش مصدر ليه.</small></div>
            {data?.market && <p className={s.market} dir="auto">{data.market}</p>}
            <Group title="تكاليف التجهيز (مرة واحدة)" items={a.capex} sources={data?.sources || []} onChange={upd("capex")} />
            <Group title="المصاريف الشهرية الثابتة" items={a.fixed} sources={data?.sources || []} onChange={upd("fixed")} />
            <div className={s.group}>
              <div className={s.groupHead}><b>البيع</b><small>الوحدة: {t.unit}</small></div>
              <div className={s.rowHead}><span>البند</span><span className={s.range}><i>أقل</i><i>متوقع</i><i>أعلى</i></span></div>
              {[["price", t.priceLabel], ["unitCost", t.costLabel], ["units", `${t.unit} في الشهر بعد الاستقرار`]].map(([k, label]) => (
                <div key={k} className={s.row}>
                  <span className={s.name}><span className={s.static}>{label}</span><span className={s.badges}><SrcBadges item={a[k]} sources={data?.sources || []} /></span></span>
                  <RangeInputs value={a[k]} onChange={(v) => setA((x) => ({ ...x, [k]: { ...x[k], ...v } }))} />
                </div>
              ))}
            </div>
            <div className={s.params}>
              <label>بداية المبيعات ٪<input inputMode="numeric" value={Math.round(a.rampStart * 100)} onChange={(e) => setA((x) => ({ ...x, rampStart: Math.min(1, toNum(e.target.value) / 100) }))} /></label>
              <label>شهور لحد الاستقرار<input inputMode="numeric" value={a.rampMonths} onChange={(e) => setA((x) => ({ ...x, rampMonths: Math.max(1, toNum(e.target.value)) }))} /></label>
              <label>التضخم السنوي ٪<input inputMode="decimal" value={a.inflation} onChange={(e) => setA((x) => ({ ...x, inflation: toNum(e.target.value) }))} /></label>
              <label>العائد المطلوب ٪<input inputMode="decimal" value={a.discountRate} onChange={(e) => setA((x) => ({ ...x, discountRate: toNum(e.target.value) }))} /></label>
              <label>ضريبة من المبيعات ٪<input inputMode="decimal" value={a.taxPct} onChange={(e) => setA((x) => ({ ...x, taxPct: toNum(e.target.value) }))} /></label>
              <label>شهور رأس المال العامل<input inputMode="numeric" value={a.workingCapitalMonths} onChange={(e) => setA((x) => ({ ...x, workingCapitalMonths: toNum(e.target.value) }))} /></label>
            </div>
          </section>

          {(data?.competitors?.length > 0 || data?.compNote || data?.apps?.length > 0) && (
            <section className={s.card} aria-label="المنافسين">
              <div className={s.head}><b>المنافسين</b><small>من خرائط جوجل{data?.apps?.length ? " ومتجر أبل" : ""}</small></div>
              {data.compNote && <p className={s.note2}>{data.compNote}</p>}
              <ul className={s.comps}>
                {data.competitors.map((c, i) => <li key={i}><b dir="auto">{c.name}</b><small>{c.rating ? `${c.rating}★ · ${n0(c.reviews)} تقييم` : "من غير تقييم"}{c.address ? ` · ${c.address}` : ""}</small></li>)}
                {data.apps.map((c, i) => <li key={`a${i}`}><a href={c.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto">{c.name}</a><small>{c.rating ? `${c.rating}★ · ${n0(c.reviews)} تقييم` : "من غير تقييم"} · {c.price || ""}</small></li>)}
              </ul>
            </section>
          )}

          <FieldData
            form={{ ...form, capital: toNum(form.capital), size: toNum(form.size) }}
            a={a}
            field={field}
            setField={setField}
            onApplyPrice={(p) => { setA((x) => ({ ...x, price: { ...x.price, mid: Math.round(p), low: Math.min(x.price.low, Math.round(p)), high: Math.max(x.price.high, Math.round(p)), est: false } })); toast("السعر المتوقع اتعدّل من نتيجة الاستبيان"); }}
          />

          <section className={s.card} aria-label="المصادر">
            <details className={s.srcBox}>
              <summary><b>المصادر ({(data?.sources || []).length})</b></summary>
              <ol className={s.sources}>
                {(data?.sources || []).map((x) => <li key={x.n} value={x.n}><a href={x.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto">{x.title}</a><small dir="auto">{x.snippet}</small></li>)}
              </ol>
            </details>
          </section>

          {!busy && (
            <div className={s.actions}>
              <button type="button" className={s.primary} onClick={writeReport}>{report ? "اكتب التقرير من جديد بالأرقام الحالية" : "اكتب تقرير دراسة الجدوى"}</button>
            </div>
          )}
        </>
      )}

      {report && (
        <section ref={reportRef} className={`${s.card} ${s.report}`} aria-label="التقرير">
          {stage === "writing" && (
            <div className={s.progress} aria-live="polite">
              <span>بكتب القسم {Math.min(progress + 1, report.length)} من {report.length}</span>
              <i style={{ "--p": `${Math.round((progress / report.length) * 100)}%` }} />
            </div>
          )}
          <div id="feasibility-report" className={`md ${s.md}`} dir="auto">
            <h1>{title}</h1>
            {report.map((x, i) => (
              <div key={x.key}>
                {x.text ? <Md>{x.text}</Md> : <h2 className={s.pending}>{x.title}</h2>}
                {x.key === "finance" && x.status === "done" && <Md>{tables}</Md>}
                {x.status === "writing" && !x.text && <p className={s.wait}><span className={s.spin} aria-hidden="true" /> بيتكتب…</p>}
                {x.status === "error" && <p className={s.secErr}>القسم ده ما اتكتبش. <button type="button" onClick={() => retry(i)} disabled={busy}>اكتبه تاني</button></p>}
              </div>
            ))}
            {stage === "done" && (
              <>
                <Md>{assumptionsLog(a, t, data?.sources || [])}</Md>
                {usedSources.length > 0 && (
                  <>
                    <h2>المصادر</h2>
                    <ol className={s.refs}>{usedSources.map((x) => <li key={x.n} value={x.n}><a href={x.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto">{x.title}</a></li>)}</ol>
                  </>
                )}
              </>
            )}
          </div>
          {stage === "done" && (
            <>
              <p className={s.note}>{DISCLAIMER}</p>
              <Link href="/feasibility/chat" className="chat-jump"><span aria-hidden="true">💬</span> ناقش دراستك في الشات المتخصص<small>بنفس الأرقام والمصادر</small></Link>
              <ShareBar text={fullText} title={title} getHtml={() => document.getElementById("feasibility-report")?.innerHTML || ""} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
