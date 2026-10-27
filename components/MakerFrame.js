"use client";
// بيفتح الأداة جوه الموقع (لو موقعها بيسمح)، ولو ما اتفتحتش في ثواني بنقولك تفتحها في تبويب
import { useState } from "react";
import s from "./maker.module.css";

export default function MakerFrame({ url, name }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div className={s.row} style={{ marginBottom: 14 }}>
        <button type="button" className={`${s.btn} ${s.main}`} onClick={() => setOpen(true)}>افتح {name} هنا جوه الموقع</button>
        <a className={s.btn} href={url} target="_blank" rel="noopener noreferrer">أو افتحها في تبويب ↗</a>
      </div>
    );
  }
  return (
    <div className={s.frameBox}>
      <iframe src={url} title={name} loading="lazy" allow="clipboard-write; fullscreen" referrerPolicy="no-referrer" />
      <div className={s.frameNote}>
        لو الصفحة ما ظهرتش أو ظهرت فاضية، الموقع بيمنع الفتح جوه مواقع تانية. <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", textDecoration: "underline" }}>افتحها في تبويب</a>.
      </div>
    </div>
  );
}
