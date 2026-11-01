"use client";
// «حاسبة الربح الصافي»: حساب في المتصفح بس (من غير ذكاء اصطناعي ومن غير ما حاجة تتبعت لأي سيرفر).
// نسب العمولة والرسوم بيكتبها التاجر من حاسبة الرسوم الرسمية في Seller Central، لأن أرقامها بتتغير حسب التصنيف والسعر والمقاس،
// وإحنا مش هنحط رقم مش متأكدين منه ونخليك تبني قرار عليه.
import { useMemo, useState } from "react";
import { MARKETS, computeProfit } from "@/lib/amazon";
import { MarketChips } from "./shared";
import { copyText } from "@/lib/imagefile";
import { toast, useStored } from "@/lib/store";
import { ICONS } from "./icons";
import s from "../seller/seller.module.css";
import a from "./amazon.module.css";

const DEFAULTS = { market: "eg", price: "", buy: "", inbound: "", refPct: "", fulfil: "", ads: "", adsMode: "pct", returnsPct: "", vatPct: "", vatIncluded: true, other: "", targetMargin: "20" };
const EXAMPLE = { price: "1200", buy: "450", inbound: "30", refPct: "12", fulfil: "95", ads: "8", adsMode: "pct", returnsPct: "4", vatPct: "14", vatIncluded: true, other: "10", targetMargin: "20" };

const fmt = (n, d = 0) => (Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—");
const pct = (n) => `${(n * 100).toFixed(1)}%`;

function Num({ id, label, unit, value, onChange, hint, placeholder }) {
  return (
    <div className={s.field} style={{ marginBottom: 0 }}>
      <label className={s.label} htmlFor={id}><span>{label}</span></label>
      <div className={a.unitInput}>
        <input id={id} className={s.input} inputMode="decimal" autoComplete="off" value={value} placeholder={placeholder || "0"} onChange={(e) => onChange(e.target.value.replace(/[^\d.,٠-٩]/g, ""))} />
        <span>{unit}</span>
      </div>
      {hint && <p className={a.hint}>{hint}</p>}
    </div>
  );
}

export default function ProfitTool() {
  const [saved, setSaved] = useStored("amz-profit", DEFAULTS);
  const [v, setLocal] = useState(null);
  const f = v || saved; // أول ما التاجر يكتب بنشتغل على النسخة المحلية، وبنحفظها بعد كل تغيير
  const set = (patch) => { const nv = { ...f, ...patch }; setLocal(nv); setSaved(nv); };
  const cur = MARKETS[f.market]?.cur || "جنيه";
  const r = useMemo(() => computeProfit(f), [f]);
  const b = r.base;

  const tone = !r.ok ? "zero" : b.profit > 0 ? "pos" : b.profit < 0 ? "neg" : "zero";
  const parts = r.ok
    ? [
        ["تكلفة المنتج والشحن للمخزن", r.landed, "#6d7a99"],
        ["عمولة أمازون", b.referral, "#ff8a3d"],
        ["رسوم الشحن والتجهيز", b.fulfil, "#ffc400"],
        ["الإعلانات", b.ads, "#a06bff"],
        ["الضريبة", b.vatAmt, "#19c6ff"],
        ["المرتجع والمصاريف", b.returns + b.other, "#f2564a"],
        ["ربحك", Math.max(0, b.profit), "#12c48b"],
      ].filter(([, n]) => n > 0)
    : [];
  const total = parts.reduce((x, [, n]) => x + n, 0) || 1;

  async function share() {
    const t = [
      `حسبة منتج على ${MARKETS[f.market].label}`,
      `سعر البيع: ${fmt(b.price)} ${cur}`,
      `الربح الصافي للوحدة: ${fmt(b.profit, 1)} ${cur} (هامش ${pct(b.margin)})`,
      r.breakEven ? `أقل سعر من غير خسارة: ${fmt(r.breakEven, 1)} ${cur}` : "",
    ].filter(Boolean).join("\n");
    if (await copyText(t)) toast("اتنسخ الملخص");
  }

  return (
    <div className={s.body}>
      <section className={s.card} aria-labelledby="pf-h">
        <div className={a.row} style={{ marginBottom: 12 }}>
          <h2 id="pf-h" className={a.grow} style={{ margin: 0 }}>بياناتك لكل وحدة</h2>
          <button type="button" className={s.miniBtn} onClick={() => set({ ...EXAMPLE })}>جرّب بمثال</button>
        </div>
        <div className={s.field}><MarketChips value={f.market} onChange={(m) => set({ market: m })} /></div>
        <div className={a.inGrid}>
          <Num id="pf-price" label="سعر البيع للمشتري" unit={cur} value={f.price} onChange={(x) => set({ price: x })} />
          <Num id="pf-buy" label="تكلفة شراء الوحدة" unit={cur} value={f.buy} onChange={(x) => set({ buy: x })} />
          <Num id="pf-in" label="شحن الوحدة لمخزن أمازون" unit={cur} value={f.inbound} onChange={(x) => set({ inbound: x })} />
          <Num id="pf-ref" label="عمولة أمازون" unit="%" value={f.refPct} onChange={(x) => set({ refPct: x })} hint="من حاسبة الرسوم في Seller Central" />
          <Num id="pf-ful" label="رسوم الشحن والتجهيز للوحدة" unit={cur} value={f.fulfil} onChange={(x) => set({ fulfil: x })} hint="FBA أو تكلفة شحنك لو بتشحن بنفسك" />
          <div>
            <label className={s.label} htmlFor="pf-ads"><span>الإعلانات</span>
              <span className={a.seg} role="group" aria-label="طريقة حساب الإعلانات">
                <button type="button" aria-pressed={f.adsMode === "pct"} onClick={() => set({ adsMode: "pct" })}>% من السعر</button>
                <button type="button" aria-pressed={f.adsMode === "flat"} onClick={() => set({ adsMode: "flat" })}>مبلغ</button>
              </span>
            </label>
            <div className={a.unitInput}>
              <input id="pf-ads" className={s.input} inputMode="decimal" value={f.ads} placeholder="0" onChange={(e) => set({ ads: e.target.value.replace(/[^\d.,٠-٩]/g, "") })} />
              <span>{f.adsMode === "pct" ? "%" : cur}</span>
            </div>
            <p className={a.hint}>{f.adsMode === "pct" ? "نسبة الإعلان من سعر الوحدة (ACoS)" : "كام بتدفع إعلانات عن كل وحدة بتتباع"}</p>
          </div>
          <Num id="pf-ret" label="نسبة المرتجع" unit="%" value={f.returnsPct} onChange={(x) => set({ returnsPct: x })} hint="تقدير متحفظ: المرتجع بيتحسب خسارة كاملة" />
          <div>
            <label className={s.label} htmlFor="pf-vat"><span>ضريبة القيمة المضافة</span>
              <span className={a.seg} role="group" aria-label="السعر شامل الضريبة؟">
                <button type="button" aria-pressed={f.vatIncluded} onClick={() => set({ vatIncluded: true })}>السعر شامل</button>
                <button type="button" aria-pressed={!f.vatIncluded} onClick={() => set({ vatIncluded: false })}>مش شامل</button>
              </span>
            </label>
            <div className={a.unitInput}>
              <input id="pf-vat" className={s.input} inputMode="decimal" value={f.vatPct} placeholder="0" onChange={(e) => set({ vatPct: e.target.value.replace(/[^\d.,٠-٩]/g, "") })} />
              <span>%</span>
            </div>
            <p className={a.hint}>اسأل محاسبك لو مش متأكد من وضعك الضريبي</p>
          </div>
          <Num id="pf-other" label="مصاريف تانية للوحدة" unit={cur} value={f.other} onChange={(x) => set({ other: x })} hint="تغليف، باركود، تخزين…" />
          <Num id="pf-tm" label="هامش الربح اللي عايزه" unit="%" value={f.targetMargin} onChange={(x) => set({ targetMargin: x })} hint="هنقولك السعر المطلوب عشان توصله" />
        </div>
        <p className={a.hint} style={{ marginTop: 14 }}>الأرقام بتتحفظ على جهازك بس، ومش بتتبعت لأي مكان.</p>
      </section>

      {!r.ok ? (
        <section className={s.card}><p className={s.note}>اكتب سعر البيع وتكلفة الشراء وهتظهر النتيجة هنا فوراً.</p></section>
      ) : (
        <section className={s.card} aria-labelledby="pf-r" aria-live="polite">
          <h2 id="pf-r" className={s.sr}>النتيجة</h2>
          <div className={a.stack}>
            <div className={`${a.profit} ${a[tone]}`}>
              <small>{b.profit >= 0 ? "ربحك الصافي في الوحدة" : "خسارتك في الوحدة"}</small>
              <strong>{fmt(b.profit, 1)} <span style={{ fontSize: "0.4em", fontWeight: 700 }}>{cur}</span></strong>
              <div className={a.sub2}><span>هامش {pct(b.margin)}</span><span>عائد على الاستثمار {pct(b.roi)}</span></div>
            </div>

            {r.missing.length > 0 && (
              <p className={s.note}><span aria-hidden="true">{ICONS.warn}</span><span><b>الحساب ناقص:</b> سيبت {r.missing.join(" و")} فاضيين فاتحسبوا بصفر، فالربح اللي فوق متفائل. اكتبهم عشان الرقم يبقى حقيقي.</span></p>
            )}

            <div>
              <div className={a.bar} role="img" aria-label="توزيع سعر البيع">
                {parts.map(([label, n, c]) => <i key={label} style={{ width: `${(n / total) * 100}%`, background: c }} title={label} />)}
              </div>
              <ul className={a.legend}>
                {parts.map(([label, n, c]) => (
                  <li key={label}><i style={{ background: c }} />{label}<b>{fmt(n, 1)} {cur}</b></li>
                ))}
              </ul>
            </div>

            <div className={a.kv}>
              <div><small>أقل سعر من غير خسارة</small><b>{r.breakEven ? `${fmt(r.breakEven, 1)} ${cur}` : "مستحيل بالنسب دي"}</b></div>
              <div><small>{`السعر لهامش ${f.targetMargin || 0}%`}</small><b>{r.forTarget ? `${fmt(r.forTarget, 1)} ${cur}` : "—"}</b></div>
            </div>

            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: "0.95rem" }}>لو غيّرت السعر</h3>
              <table className={a.table}>
                <thead><tr><th>السعر</th><th>الربح للوحدة</th><th>الهامش</th></tr></thead>
                <tbody>
                  {r.scenarios.map((x) => (
                    <tr key={x.k} style={x.k === 1 ? { fontWeight: 800 } : undefined}>
                      <td>{fmt(x.price)} {x.k !== 1 && <bdi dir="ltr">({x.k < 1 ? "−10" : "+10"}%)</bdi>}</td>
                      <td style={{ color: x.profit < 0 ? "#b42318" : undefined }}>{fmt(x.profit, 1)}</td>
                      <td>{pct(x.margin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className={`${s.cta} ${s.blue}`} onClick={share}>انسخ ملخص الحسبة</button>
          </div>
        </section>
      )}
    </div>
  );
}
