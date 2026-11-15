"use client";
// مقارنة الأنشطة التجارية: من نشاطين لخمسة. الأرقام بتتحسب بالكود من افتراضات العميل (lib/bizcompare.js).
import { useEffect, useMemo, useState } from "react";
import { useStored, toast } from "@/lib/store";
import { MAX_BIZ, MIN_BIZ, RATINGS, METRICS, emptyBiz, compareAll, fmt } from "@/lib/bizcompare";
import s from "./bizcompare.module.css";

const FIELDS = [
  ["capital", "رأس المال المتاح (اختياري)"],
  ["setup", "تكاليف التأسيس (ج)"],
  ["fixed", "المصاريف الشهرية الثابتة (ج)"],
  ["price", "سعر البيع للوحدة (ج)"],
  ["unitCost", "تكلفة الوحدة (ج)"],
  ["units", "الكمية المتوقع بيعها شهرياً"],
  ["tax", "ضريبة على المبيعات ٪ (اختياري)"],
];

function Bars({ title, unit, rows, valueKey, f, lowerBetter }) {
  const vals = rows.map((r) => r[valueKey]);
  const max = Math.max(0, ...vals.filter((v) => Number.isFinite(v)).map(Math.abs));
  return (
    <figure className={s.chart}>
      <figcaption>{title}{unit ? <small> ({unit})</small> : null}</figcaption>
      {rows.map((r, i) => {
        const v = r[valueKey];
        const ok = Number.isFinite(v);
        const w = ok && max ? Math.max(2, (Math.abs(v) / max) * 100) : 0;
        return (
          <div key={r.id} className={s.barRow}>
            <span className={s.barName}>{r.name}</span>
            <span className={s.barTrack}><i className={`${s.bar} ${ok && v < 0 ? s.neg : ""} ${lowerBetter ? s.alt : ""}`} style={{ width: `${w}%` }} /></span>
            <b className={s.barVal}>{f(v)}</b>
          </div>
        );
      })}
    </figure>
  );
}

export default function BizCompare() {
  const [draft, setDraft] = useStored("compare-draft", null);
  const [saved, setSaved] = useStored("compare-saved", []);
  const [list, setList] = useState(() => [emptyBiz(1), emptyBiz(2)]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || !draft) return;
    if (Array.isArray(draft) && draft.length >= MIN_BIZ) setList(draft);
    setLoaded(true);
  }, [draft, loaded]);

  const upd = (id, k, v) => setList((l) => l.map((b) => (b.id === id ? { ...b, [k]: v } : b)));
  const add = () => setList((l) => (l.length < MAX_BIZ ? [...l, emptyBiz(l.length + 1)] : l));
  const del = (id) => setList((l) => (l.length > MIN_BIZ ? l.filter((b) => b.id !== id) : l));

  const { rows, best, wins } = useMemo(() => compareAll(list), [list]);
  const ready = rows.filter((r) => r.ready);

  function save() {
    const name = prompt("اسم المقارنة")?.trim();
    if (!name) return;
    const item = { id: `c${Date.now().toString(36)}`, name, at: Date.now(), list };
    setSaved([item, ...saved].slice(0, 20));
    setDraft(list);
    toast("اتحفظت المقارنة في مشروعاتي ✓");
  }

  function csv() {
    const head = ["المعيار", ...rows.map((r) => r.name)];
    const lines = METRICS.map((m) => [m.label, ...rows.map((r) => fmt[m.fmt](r[m.key]))]);
    const body = [head, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
    a.download = "مقارنة-الأنشطة.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className={s.wrap}>
      <div className={s.legend}>
        <span><b>افتراضاتك</b> كل أرقام الإدخال من عندك.</span>
        <span><b>محسوب</b> بمعادلات ثابتة موضحة تحت الجدول.</span>
        <span>الموقع ما بيخترعش أسعار سوق أو منافسين.</span>
      </div>

      <div className={s.cards}>
        {list.map((b, i) => (
          <section key={b.id} className={s.card} aria-label={`النشاط ${i + 1}`}>
            <div className={s.cardHead}>
              <input className={s.name} value={b.name} onChange={(e) => upd(b.id, "name", e.target.value)} placeholder={`اسم النشاط ${i + 1}، مثلاً: محل ملابس`} aria-label={`اسم النشاط ${i + 1}`} />
              {list.length > MIN_BIZ && <button type="button" className={s.x} onClick={() => del(b.id)} aria-label={`احذف النشاط ${i + 1}`}>حذف</button>}
            </div>
            <div className={s.fields}>
              {FIELDS.map(([k, label]) => (
                <label key={k} className={s.field}>
                  <span>{label}</span>
                  <input inputMode="decimal" value={b[k]} onChange={(e) => upd(b.id, k, e.target.value)} placeholder="0" />
                </label>
              ))}
            </div>
            <div className={s.rates}>
              {RATINGS.map((r) => (
                <label key={r.key} className={s.field} title={r.hint}>
                  <span>{r.label} (من 1 لـ 5)</span>
                  <select value={b[r.key]} onChange={(e) => upd(b.id, r.key, Number(e.target.value))}>
                    {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className={s.actions}>
        {list.length < MAX_BIZ && <button type="button" className={s.btn} onClick={add}>أضف نشاط ({list.length} من {MAX_BIZ})</button>}
        <button type="button" className={`${s.btn} ${s.primary}`} onClick={save}>احفظ المقارنة</button>
        <button type="button" className={s.btn} onClick={csv}>نزّل الجدول</button>
        <button type="button" className={s.btn} onClick={() => window.print()}>اطبع / PDF</button>
      </div>

      <h2 className={s.h2}>نتيجة المقارنة</h2>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr><th>المعيار</th>{rows.map((r) => <th key={r.id}>{r.name}</th>)}</tr>
          </thead>
          <tbody>
            {METRICS.map((m) => (
              <tr key={m.key}>
                <th scope="row">{m.label}</th>
                {rows.map((r, i) => <td key={r.id} className={best[m.key] === i ? s.best : ""}>{fmt[m.fmt](r[m.key])}</td>)}
              </tr>
            ))}
            <tr className={s.total}>
              <th scope="row">عدد المعايير اللي تفوّق فيها</th>
              {wins.map((w, i) => <td key={rows[i].id}>{w.toLocaleString("ar-EG")}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      <p className={s.note}>الخلية الملونة هي الأفضل في المعيار. لو القيم متساوية أو ناقصة بتظهر «—» ومفيش أفضل. عدد المعايير مجرد عدّ، مش حكم نهائي: وزن كل معيار يختلف من تاجر لتاجر.</p>

      {ready.length >= 2 ? (
        <div className={s.charts}>
          <Bars title="صافي الربح الشهري" unit="ج" rows={rows} valueKey="net" f={fmt.egp} />
          <Bars title="رأس المال المطلوب" unit="ج" rows={rows} valueKey="invest" f={fmt.egp} lowerBetter />
          <Bars title="فترة استرداد رأس المال" rows={rows} valueKey="paybackMonths" f={fmt.months} lowerBetter />
          <Bars title="نقطة التعادل" unit="وحدات شهرياً" rows={rows} valueKey="breakEvenUnits" f={fmt.num} lowerBetter />
        </div>
      ) : (
        <p className={s.empty}>اكتب سعر البيع والكمية الشهرية لنشاطين على الأقل، وبعدها الرسوم البيانية بتظهر هنا.</p>
      )}

      <details className={s.how}>
        <summary>طريقة حساب النتائج</summary>
        <ul>
          <li>رأس المال المطلوب = تكاليف التأسيس + مصاريف ثابتة لمدة ٣ شهور (رأس مال عامل).</li>
          <li>المبيعات الشهرية = سعر البيع × الكمية الشهرية.</li>
          <li>صافي الربح الشهري = المبيعات − (تكلفة الوحدة × الكمية) − المصاريف الثابتة − الضريبة.</li>
          <li>هامش الربح = (السعر − تكلفة الوحدة) ÷ السعر.</li>
          <li>نقطة التعادل = المصاريف الثابتة ÷ ربح الوحدة بعد الضريبة.</li>
          <li>فترة الاسترداد = رأس المال المطلوب ÷ صافي الربح الشهري، وبتظهر لما يكون الصافي موجب بس.</li>
          <li>الطلب والمنافسة والمخاطر وسهولة التشغيل والتوسع: تقييمك أنت من ١ لـ ٥، ومش بيانات سوق.</li>
          <li>الحساب على أساس ثبات المبيعات من أول شهر، من غير تضخم أو فترة نمو. لدراسة أدق استخدم دراسة الجدوى.</li>
        </ul>
      </details>

      {saved.length > 0 && (
        <div className={s.savedBox}>
          <h2 className={s.h2}>مقارناتك المحفوظة</h2>
          {saved.map((c) => (
            <div key={c.id} className={s.savedRow}>
              <span><b>{c.name}</b> <small>{c.list.length.toLocaleString("ar-EG")} أنشطة</small></span>
              <button type="button" className={s.btn} onClick={() => { setList(c.list); window.scrollTo({ top: 0, behavior: "smooth" }); }}>افتح</button>
              <button type="button" className={s.btn} onClick={() => setSaved(saved.filter((x) => x.id !== c.id))}>احذف</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
