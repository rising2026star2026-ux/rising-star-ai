"use client";
// مقارن الاشتراكات + متابعة الأسعار (محفوظة على جهازك) + سجل التغيّرات
import { useMemo, useState } from "react";
import BotIcon from "./BotIcon";
import { useStored, toast } from "@/lib/store";
import {
  SUB_TOOLS, NEEDS, PRICE_CHANGES, USD_EGP, PRICES_UPDATED, PRICES_UPDATED_AR, priceSnapshot, fmtEgp, fmtUsd,
} from "@/lib/subscriptions";
import s from "./subs.module.css";

const needName = Object.fromEntries(NEEDS.map((n) => [n.id, n.name]));
const BellIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 19a2 2 0 004 0" />
  </svg>
);

/** فروق بين السعر المحفوظ وقت المتابعة والسعر الحالي لأداة واحدة */
function diffsFor(tool, saved) {
  const out = [];
  if (!saved) return out;
  for (const p of tool.plans) {
    const was = saved.snap?.[p.name];
    if (was === undefined) out.push({ plan: p.name, kind: "new", now: p.usd });
    else if (was !== p.usd) out.push({ plan: p.name, kind: p.usd > was ? "up" : "down", was, now: p.usd });
  }
  for (const name of Object.keys(saved.snap || {})) {
    if (!tool.plans.some((p) => p.name === name)) out.push({ plan: name, kind: "gone", was: saved.snap[name] });
  }
  return out;
}

export default function SubsHub() {
  const [need, setNeed] = useState("all");
  const [cur, setCur] = useState("egp");
  const [yearly, setYearly] = useState(false);
  const [watch, setWatch] = useStored("watch", {});

  const money = (usd) => (cur === "egp" ? fmtEgp(usd) : usd === 0 ? "مجاني" : fmtUsd(usd));
  const list = useMemo(
    () => SUB_TOOLS.filter((t) => need === "all" || t.plans.some((p) => p.covers[need])),
    [need],
  );

  const watched = SUB_TOOLS.filter((t) => watch[t.id]);
  const changes = watched.map((t) => ({ t, d: diffsFor(t, watch[t.id]) }));
  const changedCount = changes.filter((c) => c.d.length).length;

  function toggle(t) {
    if (watch[t.id]) {
      const { [t.id]: _gone, ...rest } = watch;
      setWatch(rest);
      toast(`وقفنا متابعة ${t.name}`);
    } else {
      setWatch({ ...watch, [t.id]: { snap: priceSnapshot()[t.id], at: PRICES_UPDATED } });
      toast(`بنتابع أسعار ${t.name}. هنبلّغك هنا لو اتغيرت`);
    }
  }
  function accept(t) {
    setWatch({ ...watch, [t.id]: { snap: priceSnapshot()[t.id], at: PRICES_UPDATED } });
  }

  const describe = (d) => {
    if (d.kind === "up") return `${d.plan}: غلي من ${fmtUsd(d.was)} إلى ${fmtUsd(d.now)} (≈ ${fmtEgp(d.now)})`;
    if (d.kind === "down") return `${d.plan}: رخص من ${fmtUsd(d.was)} إلى ${fmtUsd(d.now)} (≈ ${fmtEgp(d.now)})`;
    if (d.kind === "new") return `خطة جديدة ${d.plan} بسعر ${fmtUsd(d.now)} (≈ ${fmtEgp(d.now)})`;
    return `خطة ${d.plan} اتشالت`;
  };

  return (
    <div className={s.stack}>
      <div className={s.note}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
        <span>
          الأسعار بالدولار شهرياً من مصادر منشورة لحد {PRICES_UPDATED_AR}، والجنيه تقريبي على سعر {USD_EGP} للدولار ومن غير رسوم البنك والضرائب.
          اتأكد دايماً من صفحة الأداة الرسمية قبل ما تدفع.
        </span>
      </div>

      {watched.length > 0 && (
        <section className={s.panel} aria-labelledby="watch-h">
          <h2 id="watch-h">متابعاتي {changedCount > 0 && <span style={{ color: "#b42318", fontSize: "0.82rem" }}>({changedCount} فيها تغيير)</span>}</h2>
          <p>بنقارن سعر كل أداة بالسعر اللي كان وقت ما تابعتها. المتابعة محفوظة على جهازك بس، وبعد تسجيل الدخول هتوصلك على الإيميل وواتساب.</p>
          <div className={s.row}>
            {changes.map(({ t, d }) =>
              d.length ? (
                <div key={t.id} className={`${s.alert} ${d.every((x) => x.kind === "down" || x.kind === "new") ? s.down : ""}`}>
                  <span><b>{t.name}</b>: {d.map(describe).join(" · ")}</span>
                  <button type="button" className={s.pill} onClick={() => accept(t)}>تمام، شفت</button>
                </div>
              ) : (
                <div key={t.id} className={`${s.alert} ${s.ok}`}>
                  <span><b>{t.name}</b>: مفيش تغيير في الأسعار من وقت المتابعة</span>
                  <button type="button" className={s.pill} onClick={() => toggle(t)}>إلغاء المتابعة</button>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      <div className={s.toolbar}>
        <div className={s.chips} role="group" aria-label="فلترة بالاحتياج">
          <button type="button" className={`chip ${need === "all" ? "active" : ""}`} onClick={() => setNeed("all")}>الكل</button>
          {NEEDS.map((n) => (
            <button key={n.id} type="button" className={`chip ${need === n.id ? "active" : ""}`} onClick={() => setNeed(n.id)}>{n.name}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div className={s.seg} role="group" aria-label="العملة">
            <button type="button" className={cur === "egp" ? s.on : ""} onClick={() => setCur("egp")}>جنيه</button>
            <button type="button" className={cur === "usd" ? s.on : ""} onClick={() => setCur("usd")}>دولار</button>
          </div>
          <div className={s.seg} role="group" aria-label="مدة الدفع">
            <button type="button" className={!yearly ? s.on : ""} onClick={() => setYearly(false)}>شهري</button>
            <button type="button" className={yearly ? s.on : ""} onClick={() => setYearly(true)}>سنوي (لو متاح)</button>
          </div>
        </div>
      </div>

      {list.map((t) => (
        <article key={t.id} className={s.tool} aria-labelledby={`t-${t.id}`}>
          <header className={s.toolHead}>
            <BotIcon bot={t} size={44} />
            <div className={s.toolMeta}>
              <h2 id={`t-${t.id}`}><bdi>{t.name}</bdi></h2>
              <p><bdi>{t.maker}</bdi></p>
            </div>
            <div className={s.toolActions}>
              <button type="button" className={`${s.pill} ${watch[t.id] ? s.on : ""}`} onClick={() => toggle(t)} aria-pressed={!!watch[t.id]}>
                <BellIcon />{watch[t.id] ? "بتابعه" : "تابع السعر"}
              </button>
              <a className={s.pill} href={t.url} target="_blank" rel="noopener noreferrer">الموقع الرسمي</a>
            </div>
          </header>
          <div className={s.plans}>
            {t.plans.filter((p) => need === "all" || p.covers[need]).map((p) => {
              const showYear = yearly && p.usdYear !== undefined;
              const shown = showYear ? p.usdYear : p.usd;
              const covers = Object.keys(p.covers).filter((k) => need === "all" || k === need);
              return (
                <div key={p.name} className={s.plan}>
                  <div className={s.planName}>{p.name}</div>
                  <div className={s.price}>
                    {showYear && <del>{money(p.usd)}</del>}
                    {money(shown)}
                    <small>{shown === 0 ? "" : showYear ? "شهرياً (سنوي)" : "شهرياً"}</small>
                  </div>
                  <div className={s.planInfo}>
                    {p.note}
                    <div className={s.covers}>{covers.map((k) => <span key={k}>{needName[k]}</span>)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={s.src}>
            <span>المصدر:</span>
            {t.sources.map((x) => <a key={x.u} href={x.u} target="_blank" rel="noopener noreferrer"><bdi dir="rtl">{x.t}</bdi></a>)}
          </div>
        </article>
      ))}

      <section className={s.panel} aria-labelledby="log-h">
        <h2 id="log-h">آخر تغيّرات الأسعار</h2>
        <p>تغيّرات موثّقة بمصادرها. بنضيف هنا أي تغيير بنلاحظه.</p>
        <ul className={`${s.log} ${s.list}`}>
          {PRICE_CHANGES.map((c) => (
            <li key={c.date + c.tool}>
              <time dateTime={c.date}>{c.date.split("-").reverse().join("/")}</time>
              <span><b>{c.tool}</b>: {c.text} <a href={c.href} target="_blank" rel="noopener noreferrer">المصدر</a></span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
