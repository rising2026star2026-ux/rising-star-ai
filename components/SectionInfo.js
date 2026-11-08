"use client";
// زرار في ركن صفحة القسم بيفتح لوحة: إمكانيات القسم دلوقتي، وخطة تطويره.
import { useEffect, useRef, useState } from "react";
import s from "./sectioninfo.module.css";

export default function SectionInfo({ name, can, soon, credit = null }) {
  const [open, setOpen] = useState(false);
  const btn = useRef(null);
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); btn.current?.focus(); };
  }, [open]);

  return (
    <>
      <button ref={btn} type="button" className={s.fab} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6v.1" /></svg>
        <span>إمكانيات القسم</span>
      </button>
      {open && (
        <div className={s.scrim} onClick={() => setOpen(false)}>
          <div ref={panel} className={s.panel} role="dialog" aria-modal="true" aria-label={`إمكانيات ${name}`} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
            <header>
              <h2>{name}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق">✕</button>
            </header>
            <h3>متاح دلوقتي</h3>
            <ul className={s.can}>{can.map((x) => <li key={x}>{x}</li>)}</ul>
            <h3>في خطة التطوير</h3>
            <ul className={s.soon}>{soon.map((x) => <li key={x}>{x}</li>)}</ul>
            <p className={s.note}>دي خطط مش مواعيد. وعايز ميزة معينة؟ قولّنا من صفحة الدعم.</p>
            {credit && <p className={s.note}>صورة الخلفية: <a href={credit.href} target="_blank" rel="noopener noreferrer">{credit.name} على Unsplash</a></p>}
          </div>
        </div>
      )}
    </>
  );
}
