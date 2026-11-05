"use client";
// كل موديلات OpenRouter المفتوحة في الموقع: شات، صور، صوت (من غير فيديو).
// الشات بيفتح في /chat، والصور والصوت بيفتحوا في استوديو الموديلات.
import { useMemo, useState } from "react";
import Link from "next/link";
import s from "./allmodels.module.css";

const TABS = [
  { id: "text", label: "شات" },
  { id: "image", label: "صور" },
  { id: "audio", label: "صوت" },
];
const inTab = (m, tab) => (tab === "audio" ? m.kind === "speech" || m.kind === "audio" : m.kind === tab);
const ctx = (n) => (n >= 1e6 ? `${Math.round(n / 1e5) / 10}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : "");
const hrefOf = (m) => (m.kind === "text" ? `/chat?bot=${encodeURIComponent(`or:${m.id}`)}` : `/models/studio?m=${encodeURIComponent(m.id)}`);
const KIND = { speech: "نص لصوت", audio: "رد بالصوت", image: "صور" };

function meta(m) {
  const bits = [];
  if (m.kind === "text") {
    if (ctx(m.context)) bits.push(`سياق ${ctx(m.context)}`);
    if (m.vision) bits.push("بيفهم الصور");
  } else {
    bits.push(KIND[m.kind]);
    if (m.kind === "image" && m.vision) bits.push("بيعدّل على صورك");
  }
  if (m.free) bits.push("مجاني");
  else if (m.kind === "text" && m.out) bits.push(`$${m.out} للمليون`);
  return bits.join(" • ");
}

export default function AllModels({ models }) {
  const [tab, setTab] = useState("text");
  const [q, setQ] = useState("");
  const [maker, setMaker] = useState("");
  const [free, setFree] = useState(false);

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.id, models.filter((m) => inTab(m, t.id)).length])), [models]);
  const makers = useMemo(() => {
    const c = new Map();
    for (const m of models) if (inTab(m, tab)) c.set(m.maker, (c.get(m.maker) || 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }, [models, tab]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return models.filter((m) => inTab(m, tab) && (!maker || m.maker === maker) && (!free || m.free) && (!t || `${m.name} ${m.maker} ${m.id}`.toLowerCase().includes(t)));
  }, [models, tab, maker, free, q]);

  const pickTab = (id) => { setTab(id); setMaker(""); };

  return (
    <main className={s.page}>
      <header className={s.head}>
        <h1>كل الموديلات المفتوحة</h1>
        <p>{models.length ? `${models.length} موديل من ${new Set(models.map((m) => m.maker)).size} شركة حول العالم. اختار موديل وابدأ على طول.` : "القايمة مش متاحة دلوقتي، جرّب بعد شوية."}</p>
      </header>

      <div className={s.tabs} role="tablist" aria-label="نوع الموديل">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? s.tabOn : s.tab} onClick={() => pickTab(t.id)}>
            {t.label} <span>{counts[t.id] || 0}</span>
          </button>
        ))}
      </div>

      <div className={s.tools}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر باسم الموديل أو الشركة" aria-label="بحث في الموديلات" dir="auto" />
        <select value={maker} onChange={(e) => setMaker(e.target.value)} aria-label="الشركة">
          <option value="">كل الشركات</option>
          {makers.map(([mk, c]) => <option key={mk} value={mk}>{mk} ({c})</option>)}
        </select>
        <label className={s.chk}><input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> المجانية بس</label>
      </div>
      <p className={s.note}>
        {tab === "text"
          ? "ممكن موديل يبطّأ أو يتوقف في وقت الزحمة، ساعتها الموقع بيكمل الرد بموديل بديل."
          : "الصور والصوت بيفتحوا في استوديو فيه كل إعدادات الموديل: المقاس والدقة والعدد والصور المرجعية والأصوات."}
      </p>

      <ul className={s.grid}>
        {list.map((m) => (
          <li key={m.id}>
            <Link href={hrefOf(m)} className={s.card}>
              <b dir="auto">{m.name}</b>
              <span dir="auto">{m.maker}</span>
              <em>{meta(m)}</em>
            </Link>
          </li>
        ))}
      </ul>
      {!list.length && models.length > 0 && <p className={s.empty}>مفيش موديل بالاختيارات دي. غيّر البحث أو الشركة.</p>}
    </main>
  );
}
