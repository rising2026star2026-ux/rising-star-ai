"use client";
// قايمة أدوات المجال: بحث بالاسم وفلتر بنوع التسعير
import { useMemo, useState } from "react";
import Link from "next/link";
import BotIcon from "./BotIcon";
import s from "./directory.module.css";

const FILTERS = [
  ["all", "الكل"],
  ["free", "مجاني"],
  ["freemium", "مجاني + خطط مدفوعة"],
  ["trial", "تجربة مجانية"],
  ["paid", "مدفوع"],
];
const LABEL = { free: "مجاني", freemium: "مجاني + خطط مدفوعة", trial: "تجربة مجانية ثم مدفوع", paid: "مدفوع", unknown: "التسعير على موقع الأداة" };

export default function DirTools({ items }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return items.filter((t) => (f === "all" || t.pricing === f) && (!k || t.name.toLowerCase().includes(k) || t.summary.toLowerCase().includes(k)));
  }, [items, q, f]);

  return (
    <>
      <div className={s.search}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر على أداة في المجال ده" aria-label="بحث في أدوات المجال" />
      </div>
      <div className={s.filters} role="group" aria-label="فلتر التسعير">
        {FILTERS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={f === id} onClick={() => setF(id)}>{label}</button>
        ))}
      </div>
      {list.length ? (
        <div className={s.grid}>
          {list.map((t) => (
            <Link key={t.href} href={t.href} className={s.tool}>
              <BotIcon bot={t} size={46} />
              <span>
                <b dir="auto">{t.name}</b>
                <small>{t.summary}</small>
                {t.featured
                  ? <span className={`${s.badge} ${s.star}`}>من الأشهر</span>
                  : <span className={`${s.badge} ${s[t.pricing] || s.unknown}`}>{LABEL[t.pricing] || LABEL.unknown}</span>}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className={s.empty}>مفيش أدوات بالشروط دي.</p>
      )}
    </>
  );
}
