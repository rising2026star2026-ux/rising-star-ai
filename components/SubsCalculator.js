"use client";
// حاسبة «أنا محتاج إيه؟»: تختار احتياجاتك ومستوى استخدامك، وتطلع لك أقل مجموعة اشتراكات تغطيها
import { useMemo, useState } from "react";
import BotIcon from "./BotIcon";
import { SUB_TOOLS, NEEDS, LEVELS, USD_EGP, cheapestBundle, alternativesFor, toEgp, fmtEgp, fmtUsd } from "@/lib/subscriptions";
import s from "./subs.module.css";

const needName = Object.fromEntries(NEEDS.map((n) => [n.id, n.name]));
const toolById = Object.fromEntries(SUB_TOOLS.map((t) => [t.id, t]));

export default function SubsCalculator() {
  const [needs, setNeeds] = useState(["chat"]);
  const [level, setLevel] = useState(2);
  const [budget, setBudget] = useState("");

  const toggle = (id) => setNeeds((n) => (n.includes(id) ? n.filter((x) => x !== id) : [...n, id]));

  const res = useMemo(() => (needs.length ? cheapestBundle(needs, level) : null), [needs, level]);
  const tips = useMemo(() => {
    if (!res || needs.length < 2) return [];
    return needs
      .map((n) => ({ n, rest: cheapestBundle(needs.filter((x) => x !== n), level).total }))
      .map((x) => ({ ...x, save: res.total - x.rest }))
      .filter((x) => x.save > 0)
      .sort((a, b) => b.save - a.save)
      .slice(0, 2);
  }, [res, needs, level]);

  const budgetEgp = Number(budget) || 0;
  const over = res && budgetEgp > 0 && toEgp(res.total) > budgetEgp;

  return (
    <div className={s.stack}>
      <section className={s.panel} aria-labelledby="needs-h">
        <h2 id="needs-h">1. إنت محتاج إيه؟</h2>
        <p>اختار كل اللي بتستخدمه (اختار واحد أو أكتر).</p>
        <div className={s.needs}>
          {NEEDS.map((n) => (
            <button key={n.id} type="button" className={`${s.need} ${needs.includes(n.id) ? s.on : ""}`} onClick={() => toggle(n.id)} aria-pressed={needs.includes(n.id)}>
              <b>{n.name}</b><span>{n.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={s.panel} aria-labelledby="lvl-h">
        <h2 id="lvl-h">2. هتستخدمه قد إيه؟</h2>
        <p>ده اللي بيحدد لو الخطة المجانية كفاية ولا لأ.</p>
        <div className={s.needs}>
          {LEVELS.map((l) => (
            <button key={l.id} type="button" className={`${s.need} ${level === l.id ? s.on : ""}`} onClick={() => setLevel(l.id)} aria-pressed={level === l.id}>
              <b>{l.name}</b><span>{l.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={s.panel} aria-labelledby="bud-h">
        <h2 id="bud-h">3. ميزانيتك (اختياري)</h2>
        <div className={s.field}>
          <label htmlFor="budget">أقصى مبلغ في الشهر بالجنيه</label>
          <input id="budget" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ""))} placeholder="مثلاً 500" />
        </div>
      </section>

      {!needs.length && <p className="empty">اختار احتياج واحد على الأقل.</p>}

      {res && needs.length > 0 && (
        <section className={s.result} aria-live="polite">
          <div className={s.resultHead}>
            <h2>أقل تكلفة تغطي احتياجاتك</h2>
            <div className={s.total}>{res.total === 0 ? "مجاناً" : `${toEgp(res.total).toLocaleString("en-US")} ج`}<small>{res.total === 0 ? "" : `في الشهر (≈ ${fmtUsd(res.total)})`}</small></div>
          </div>

          {res.picks.map((o) => {
            const t = toolById[o.toolId];
            const covered = needs.filter((n) => o.covers[n] >= level);
            return (
              <div key={o.toolId} className={s.pick}>
                <BotIcon bot={t} size={42} />
                <div className={s.grow}>
                  <h3 dir="auto">{o.tool} <span style={{ color: "var(--muted)", fontWeight: 300 }} dir="ltr">· {o.plan}</span></h3>
                  <p>بتغطي: {covered.map((n) => needName[n]).join("، ")}</p>
                </div>
                <b>{fmtEgp(o.usd)}</b>
              </div>
            );
          })}

          {res.uncovered.length > 0 && (
            <div className={s.tips}>
              <span style={{ color: "#8b1f18" }}>
                مفيش خطة في قاعدة بياناتنا بتغطي ({res.uncovered.map((n) => needName[n]).join("، ")}) بمستوى «{LEVELS[level - 1].name}». جرب مستوى أقل أو شوف المقارن.
              </span>
            </div>
          )}

          {over && (
            <div className={s.tips}>
              <span style={{ color: "#8b1f18" }}>
                ده أعلى من ميزانيتك بحوالي {(toEgp(res.total) - budgetEgp).toLocaleString("en-US")} ج.
                {tips[0] ? ` لو شلت «${needName[tips[0].n]}» هتوفر حوالي ${toEgp(tips[0].save).toLocaleString("en-US")} ج.` : ""}
              </span>
            </div>
          )}
          {!over && budgetEgp > 0 && res.total > 0 && (
            <div className={s.tips}><span style={{ color: "#17623a" }}>جوه ميزانيتك. فاضل حوالي {(budgetEgp - toEgp(res.total)).toLocaleString("en-US")} ج.</span></div>
          )}
          {tips.length > 0 && !over && (
            <div className={s.tips}>
              {tips.map((t) => <span key={t.n}>لو استغنيت عن «{needName[t.n]}» هتوفر حوالي {toEgp(t.save).toLocaleString("en-US")} ج في الشهر.</span>)}
            </div>
          )}

          {needs.map((n) => (
            <details key={n} className={s.alts}>
              <summary>بدائل لـ «{needName[n]}»</summary>
              <ul style={{ margin: "6px 0 0", paddingInlineStart: 18 }}>
                {alternativesFor(n, level, 4).map((o) => (
                  <li key={o.toolId + o.plan}><span dir="auto">{o.tool}</span> <span dir="ltr">({o.plan})</span>: {fmtEgp(o.usd)}</li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      )}

      <div className={s.note}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
        <span>
          الحاسبة بتختار من الخطط اللي في المقارن بس، وبتفترض إن الخطة الواحدة بتغطي الاحتياجات المكتوبة عليها عند مستوى الاستخدام ده (تقدير مش ضمان). السعر الجنيه تقريبي على {USD_EGP} للدولار.
          لو تحتاج أدوات تانية، شوف <a href="/models" style={{ textDecoration: "underline" }}>الموديلات والبرامج</a>.
        </span>
      </div>
    </div>
  );
}
