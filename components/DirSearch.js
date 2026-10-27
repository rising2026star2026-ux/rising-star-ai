"use client";
// بحث سريع في كل أدوات الدليل بالاسم
import { useMemo, useState } from "react";
import Link from "next/link";
import s from "./directory.module.css";

export default function DirSearch({ index }) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (k.length < 2) return [];
    return index.filter(([name]) => name.toLowerCase().includes(k)).slice(0, 12);
  }, [index, q]);
  return (
    <>
      <div className={s.search}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب اسم أداة، مثلاً: Canva" aria-label="بحث في كل الأدوات" />
      </div>
      {hits.length > 0 && (
        <div className={s.hits}>
          {hits.map(([name, href, cat]) => (
            <Link key={href} href={href} className={s.hit}><b dir="auto">{name}</b><small>{cat}</small></Link>
          ))}
        </div>
      )}
    </>
  );
}
