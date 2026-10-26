"use client";
// معرض الموديلات والبرامج (زي Poe): أقسام، وكل قسم صف كروت بلوجو واسم، و«عرض الكل» بيفرده شبكة
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BotIcon from "./BotIcon";
import ProCode from "./ProCode";
import { useStored, toast, write } from "@/lib/store";
import s from "./models.module.css";

export default function ModelsGallery({ sections, bots }) {
  const router = useRouter();
  const [code] = useStored("pro-code", "");
  const [open, setOpen] = useState({});
  const [q, setQ] = useState("");
  const proRef = useRef(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return bots;
    return bots.filter((b) => `${b.name} ${b.maker} ${b.desc}`.toLowerCase().includes(t));
  }, [q, bots]);

  function pick(b) {
    if (!b.available) {
      toast("الموديل ده هيتفعّل قريب");
      return;
    }
    if (b.tier === "pro" && !code) {
      toast("الموديل ده محتاج كود تفعيل. أدخل الكود الأول");
      proRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      proRef.current?.querySelector("input")?.focus({ preventScroll: true });
      return;
    }
    write("bot", b.key);
    router.push(`/chat?bot=${b.key}`);
  }

  function Tile({ b, expanded }) {
    const inner = (
      <>
        {!b.available && <em className={s.soon}>قريباً</em>}
        <BotIcon bot={b} size={expanded ? 64 : 72} />
        <span className={s.tileName} dir="auto">{b.name}</span>
        {expanded && <span className={s.tileDesc}>{b.desc}</span>}
      </>
    );
    const cls = `${s.tile} ${b.available ? "" : s.tileOff}`;
    if (b.external) {
      return <a className={cls} href={b.url} target="_blank" rel="noopener noreferrer" title={`${b.desc} — ${b.maker}`}>{inner}</a>;
    }
    if (b.href) return <Link className={cls} href={b.href} title={b.desc}>{inner}</Link>;
    return <button type="button" className={cls} onClick={() => pick(b)} title={b.desc}>{inner}</button>;
  }

  return (
    <div className={s.gallery}>
      <div className={s.searchRow}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" />
        </svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن موديل أو برنامج: Claude، Midjourney، CapCut..." aria-label="ابحث عن موديل أو برنامج" dir="auto" />
      </div>

      {sections.map((sec) => {
        const list = filtered.filter((b) => b.section === sec.id);
        if (!list.length) return null;
        const expanded = open[sec.id] || !!q.trim();
        return (
          <section key={sec.id} className={s.section} aria-labelledby={`sec-${sec.id}`}>
            <div className={s.sectionHead}>
              <div>
                <h2 id={`sec-${sec.id}`}>{sec.title}</h2>
                <p>{sec.sub}</p>
              </div>
              {list.length > 5 && !q.trim() && (
                <button type="button" className={s.seeAll} onClick={() => setOpen((o) => ({ ...o, [sec.id]: !o[sec.id] }))}>
                  {expanded ? "أقل" : "عرض الكل"}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 6l-6 6l6 6" /></svg>
                </button>
              )}
            </div>
            <div className={expanded ? s.grid : s.row}>
              {list.map((b) => <Tile key={b.key} b={b} expanded={expanded} />)}
            </div>
          </section>
        );
      })}

      {!filtered.length && <p className={s.empty}>مفيش موديل أو برنامج بالاسم ده.</p>}

      <div ref={proRef}>
        <ProCode />
      </div>
      <p className={s.footNote}>
        أسماء وشعارات الموديلات والبرامج ملك شركاتها، وبتظهر هنا عشان تعرّف كل واحد بشركته. البرامج الخارجية بتفتح في مواقعها الرسمية.
      </p>
    </div>
  );
}
