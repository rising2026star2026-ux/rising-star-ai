"use client";
// مكتبة البرومبتات: بحث + تصنيفات + نسخ بضغطة + تعبئة الأقواس [زي كده] قبل النسخ
import { useMemo, useState } from "react";
import Link from "next/link";
import s from "./prompts.module.css";

const parts = (t) => t.split(/(\[[^\]]+\])/g).filter(Boolean);

function Card({ p }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const slots = useMemo(() => [...new Set(p.text.match(/\[[^\]]+\]/g) || [])], [p.text]);
  const [vals, setVals] = useState({});
  const final = slots.reduce((t, k) => (vals[k]?.trim() ? t.split(k).join(vals[k].trim()) : t), p.text);

  async function copy() {
    try {
      await navigator.clipboard.writeText(final);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = final; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <article className={s.card}>
      <h3>{p.title}</h3>
      <p className={s.txt} dir="auto">
        {parts(final).map((x, i) => (/^\[[^\]]+\]$/.test(x) ? <mark key={i}>{x}</mark> : <span key={i}>{x}</span>))}
      </p>
      {p.tip ? <small className={s.tip}>💡 {p.tip}</small> : null}
      {open && slots.length > 0 && (
        <div className={s.slots}>
          {slots.map((k) => (
            <label key={k}>
              <span dir="auto">{k.slice(1, -1)}</span>
              <input value={vals[k] || ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} placeholder="اكتب بدلها..." />
            </label>
          ))}
        </div>
      )}
      <div className={s.btns}>
        <button type="button" className={s.copy} onClick={copy}>{copied ? "✓ اتنسخ" : "نسخ"}</button>
        {slots.length > 0 && <button type="button" onClick={() => setOpen(!open)}>{open ? "إخفاء التعديل" : "عدّل الأقواس"}</button>}
        {p.link && <Link href={p.link.href} className={s.go}>{p.link.label} ←</Link>}
      </div>
    </article>
  );
}

export default function PromptsGrid({ prompts, cats }) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    const meta = Object.fromEntries(cats.map((c) => [c.id, `${c.name} ${c.desc}`]));
    return prompts.filter((p) => (cat === "all" || p.cat === cat) && (!k || `${p.title} ${p.text} ${meta[p.cat] || ""}`.toLowerCase().includes(k)));
  }, [prompts, cats, cat, q]);
  const shown = cat === "all" && !q.trim() ? cats : cats.filter((c) => list.some((p) => p.cat === c.id));

  return (
    <>
      <div className={s.search}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر على برومبت: منتج، لوجو، ريل، كاميرا..." aria-label="بحث في البرومبتات" />
      </div>
      <div className={s.chips}>
        <button type="button" aria-pressed={cat === "all"} onClick={() => setCat("all")}>الكل ({prompts.length})</button>
        {cats.map((c) => (
          <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.icon} {c.name}</button>
        ))}
      </div>
      {!list.length && <p className={s.empty}>مفيش برومبت بالكلمة دي. جرّب كلمة تانية.</p>}
      {shown.map((c) => {
        const items = list.filter((p) => p.cat === c.id);
        if (!items.length) return null;
        return (
          <section key={c.id} className={s.sec}>
            <h2><span aria-hidden="true">{c.icon}</span> {c.name} <small>{items.length}</small></h2>
            <p className={s.cdesc}>{c.desc}</p>
            <div className={s.grid}>{items.map((p) => <Card key={p.id} p={p} />)}</div>
          </section>
        );
      })}
    </>
  );
}
