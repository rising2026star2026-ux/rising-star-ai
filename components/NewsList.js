"use client";
import { useMemo, useState } from "react";
import s from "./learn.module.css";

const KINDS = [["all", "الكل"], ["company", "الشركات"], ["news", "أخبار عالمية"], ["arabic", "أخبار عربية"]];
const fmt = (d) => new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Cairo" }).format(new Date(d));

export default function NewsList({ items }) {
  const [kind, setKind] = useState("all");
  const [co, setCo] = useState("");
  const companies = useMemo(() => [...new Set(items.filter((i) => i.kind === "company").map((i) => i.src))], [items]);
  const list = items.filter((i) => (kind === "all" || i.kind === kind) && (!co || i.src === co));
  let last = "";
  return (
    <>
      <div className={s.chips}>
        {KINDS.map(([k, l]) => <button key={k} className={`${s.chip}${kind === k && !co ? " " + s.on : ""}`} onClick={() => { setKind(k); setCo(""); }}>{l}</button>)}
      </div>
      {companies.length > 0 && (
        <div className={s.chips} aria-label="الشركات">
          {companies.map((c) => <button key={c} className={`${s.chip}${co === c ? " " + s.on : ""}`} dir="auto" onClick={() => { setCo(co === c ? "" : c); setKind("all"); }}>{c}</button>)}
        </div>
      )}
      {!list.length && <p className={s.empty}>مفيش أخبار هنا لسه. التحديث بيحصل لوحده كل يوم.</p>}
      <div className={s.news}>
        {list.map((i) => {
          const day = fmt(i.date); const head = day !== last; last = day;
          return (
            <div key={i.id}>
              {head && <div className={s.day}>{day}</div>}
              <a className={s.item} href={i.url} target="_blank" rel="noopener noreferrer">
                {i.ar ? <h3>{i.ar.title}</h3> : <h3 dir="ltr" style={{ textAlign: "start" }}>{i.title}</h3>}
                {i.ar?.summary && <p>{i.ar.summary}</p>}
                <div className={s.meta}><b dir="auto">{i.src}</b><span>المصدر ↗</span></div>
              </a>
            </div>
          );
        })}
      </div>
    </>
  );
}
