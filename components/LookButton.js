"use client";
// زرار «شكل الكتابة» الأزرق الصغير: حجم الخط، ونوع الخط، والألوان. الاختيار محفوظ على جهاز الزائر (rs:look)
// وبيتطبق على <html> كـ data-look-*، وسكربت صغير في layout.js بيطبقه قبل ما الصفحة تترسم عشان مفيش وميض.
import { useEffect, useRef, useState } from "react";
import { useStored } from "@/lib/store";
import s from "./look.module.css";

export const LOOK_DEFAULT = { size: "md", font: "naskh", mode: "light" };
const OPTS = {
  size: { label: "حجم الخط", choices: [["sm", "أصغر"], ["md", "عادي"], ["lg", "أكبر"]] },
  font: { label: "الخط", choices: [["naskh", "نسخ"], ["plex", "بسيط"], ["almarai", "واضح"]] },
  mode: { label: "الألوان", choices: [["light", "فاتح"], ["warm", "دافئ"], ["dark", "غامق"]] },
};
const clean = (look) => Object.fromEntries(Object.keys(OPTS).map((k) => [k, OPTS[k].choices.some(([v]) => v === look?.[k]) ? look[k] : LOOK_DEFAULT[k]]));

export default function LookButton() {
  const [stored, setStored] = useStored("look", LOOK_DEFAULT);
  const look = clean(stored);
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);

  useEffect(() => {
    const d = document.documentElement;
    for (const [k, v] of Object.entries(look)) d.setAttribute(`data-look-${k}`, v);
  }, [look.size, look.font, look.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", key); };
  }, [open]);

  return (
    <div className={s.wrap} ref={wrap}>
      <button type="button" className={s.btn} onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="dialog" aria-label="شكل الكتابة: الحجم والخط والألوان" title="شكل الكتابة">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 7V5h11v2M9 5v14M7 19h4M14 13v-1.5h7V13M17.5 11.5V19M16 19h3" /></svg>
      </button>
      {open && (
        <div className={s.panel} role="dialog" aria-label="شكل الكتابة">
          {Object.entries(OPTS).map(([k, o]) => (
            <fieldset key={k} className={s.group}>
              <legend>{o.label}</legend>
              <div className={s.seg}>
                {o.choices.map(([v, label]) => (
                  <button key={v} type="button" data-k={k} data-v={v} aria-pressed={look[k] === v} onClick={() => setStored({ ...look, [k]: v })}>
                    {k === "mode" && <i aria-hidden="true" />}
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <button type="button" className={s.reset} onClick={() => setStored(LOOK_DEFAULT)}>رجّع الشكل الافتراضي</button>
        </div>
      )}
    </div>
  );
}
