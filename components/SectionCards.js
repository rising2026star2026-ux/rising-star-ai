"use client";
// صفوف كروت القسم (زي تطبيقات الشات العالمية): كل صف بيتسحب بالعرض، والكارت بيتملي بتدرج لون فئته،
// وأيقونته كبيرة شفافة في الخلفية وصغيرة في دايرة بيضا. فوقهم «كمّل محادثة» من محادثات الزائر في القسم ده.
import { useEffect, useState } from "react";
import Link from "next/link";
import { GLYPHS } from "@/lib/glyphs";
import { read } from "@/lib/store";
import { chatsKey } from "@/lib/secchats";
import s from "./sectioncards.module.css";

const Glyph = ({ name, size, className }) => (
  <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={GLYPHS[name] || GLYPHS.grid} />
  </svg>
);

function Recent({ section }) {
  const [chats, setChats] = useState([]);
  useEffect(() => { setChats((read(chatsKey(section), []) || []).filter((c) => c?.id && c?.title).slice(0, 8)); }, [section]);
  if (!chats.length) return null;
  return (
    <section className={s.row} aria-label="كمّل محادثة">
      <div className={s.head}><h2>كمّل محادثة</h2></div>
      <div className={s.track}>
        {chats.map((c) => (
          <Link key={c.id} href={`/s/${section}?c=${c.id}`} className={s.recent}>
            <Glyph name="chat" size={18} />
            <span dir="auto">{c.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function SectionCards({ section, rows = [] }) {
  if (!rows.length) return null;
  return (
    <div className={s.rows}>
      <Recent section={section} />
      {rows.map((r) => (
        <section key={r.title} className={s.row} aria-label={r.title}>
          <div className={s.head}>
            <h2>{r.title}</h2>
            {r.more && <Link href={r.more} className={s.more}>عرض الكل ({r.count})</Link>}
          </div>
          <div className={s.track}>
            {r.cards.map((c) => (
              <Link key={c.href} href={c.href} className={s.card} style={{ "--c1": c.c1, "--c2": c.c2 }}>
                <Glyph name={c.glyph} size={132} className={s.mark} />
                <span className={s.badge}><Glyph name={c.glyph} size={20} /></span>
                <b>{c.title}</b>
                <span className={s.desc}>{c.desc}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
