"use client";
// شبكة المكتبة: فلترة بالتصنيف + بحث
import { useMemo, useState } from "react";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import s from "./library.module.css";

export default function LibraryGrid({ tools, cats }) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return tools.filter((t) => (cat === "all" || t.cat === cat) && (!k || `${t.name} ${t.ar} ${t.desc}`.toLowerCase().includes(k)));
  }, [tools, cat, q]);
  const shown = cat === "all" && !q.trim() ? cats : cats.filter((c) => list.some((t) => t.cat === c.id));

  return (
    <>
      <div className={s.search}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر على أداة: إزالة خلفية، صوت عربي، رسم بياني..." aria-label="بحث في المكتبة" />
      </div>
      <div className={s.chips}>
        <button type="button" aria-pressed={cat === "all"} onClick={() => setCat("all")}>الكل ({tools.length})</button>
        {cats.map((c) => (
          <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>
      {!list.length && <p className={s.empty}>مفيش أداة بالاسم ده. جرّب كلمة تانية.</p>}
      {shown.map((c) => {
        const items = list.filter((t) => t.cat === c.id);
        if (!items.length) return null;
        return (
          <section key={c.id} className={s.sec}>
            <h2><span aria-hidden="true">{c.icon}</span> {c.name} <small>{items.length}</small></h2>
            <div className={s.grid}>
              {items.map((t) => (
                <Link key={t.slug} href={`/library/${t.slug}`} className={s.card}>
                  <span className={s.head}>
                    <BrandLogo tool={t} />
                    <span className={s.names}><b>{t.ar}</b><i>{t.name}</i></span>
                  </span>
                  <small>{t.desc}</small>
                  <span className={s.tags}>
                    <em className={s.free}>مجانية</em>
                    {t.arabic ? <em className={s.ar}>تدعم العربي</em> : null}
                    {t.hf ? <em className={s.hf}>Hugging Face</em> : null}
                    {t.top ? <em className={s.top}>⭐ مميزة</em> : null}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
