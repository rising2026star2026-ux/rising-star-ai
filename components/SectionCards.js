"use client";
// رفوف كروت القسم: «كمّل محادثة» من محادثات الزائر، وبعدها أدوات القسم وأدوات الموقع حسب الفئة.
// كل كارت عليه مجسّم 3D بيوضح الأداة بتعمل إيه (lib/cardart.js)، فالزائر يشوف قبل ما يقرا.
import { useEffect, useState } from "react";
import Link from "next/link";
import { read } from "@/lib/store";
import { chatsKey } from "@/lib/secchats";
import { Shelf, ArtCard } from "./Shelf";
import s from "./sectioncards.module.css";

function Recent({ section }) {
  const [chats, setChats] = useState([]);
  useEffect(() => { setChats((read(chatsKey(section), []) || []).filter((c) => c?.id && c?.title).slice(0, 8)); }, [section]);
  if (!chats.length) return null;
  return (
    <Shelf title="كمّل محادثة">
      {chats.map((c) => (
        <Link key={c.id} href={`/s/${section}?c=${c.id}`} className={s.recent}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 11.5a8.3 8.3 0 01-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1120.5 11.5z" /></svg>
          <span dir="auto">{c.title}</span>
        </Link>
      ))}
    </Shelf>
  );
}

export default function SectionCards({ section, rows = [] }) {
  if (!rows.length) return null;
  return (
    <div className={s.rows}>
      <Recent section={section} />
      {rows.map((r) => (
        <Shelf key={r.title} title={r.title} more={r.more} count={r.count}>
          {r.cards.map((c) => <ArtCard key={c.href} {...c} />)}
        </Shelf>
      ))}
    </div>
  );
}
