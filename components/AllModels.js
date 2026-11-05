"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import s from "./allmodels.module.css";

const ctx = (n) => (n >= 1e6 ? `${Math.round(n / 1e5) / 10}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : "");

export default function AllModels({ models }) {
  const [q, setQ] = useState("");
  const [vision, setVision] = useState(false);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return models.filter((m) => (!vision || m.vision) && (!t || `${m.name} ${m.maker} ${m.id}`.toLowerCase().includes(t)));
  }, [models, q, vision]);

  return (
    <main className={s.page}>
      <header className={s.head}>
        <h1>كل الموديلات المفتوحة</h1>
        <p>{models.length ? `${models.length} موديل من شركات العالم، اختار أي واحد وابدأ الشات معاه.` : "القايمة مش متاحة دلوقتي، جرّب بعد شوية."}</p>
        <div className={s.tools}>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر باسم الموديل أو الشركة" aria-label="بحث في الموديلات" dir="auto" />
          <label className={s.chk}><input type="checkbox" checked={vision} onChange={(e) => setVision(e.target.checked)} /> بيفهم الصور</label>
        </div>
        <p className={s.note}>الموديلات دي تجريبية من مزوّدين خارجيين، فممكن تبطّأ أو تتوقف في وقت الزحمة. لو وقف موديل، الموقع بيكمل الرد بموديل بديل.</p>
      </header>
      <ul className={s.grid}>
        {list.map((m) => (
          <li key={m.id}>
            <Link href={`/chat?bot=${encodeURIComponent(`or:${m.id}`)}`} className={s.card}>
              <b dir="auto">{m.name}</b>
              <span dir="auto">{m.maker}</span>
              <em>{[ctx(m.context) && `سياق ${ctx(m.context)}`, m.vision && "صور"].filter(Boolean).join(" • ")}</em>
            </Link>
          </li>
        ))}
      </ul>
      {!list.length && models.length > 0 && <p className={s.empty}>مفيش موديل بالاسم ده. جرّب كلمة تانية.</p>}
    </main>
  );
}
