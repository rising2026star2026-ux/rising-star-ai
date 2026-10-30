"use client";
// شعار الشركة/الموديل؛ لو ما اتحمّلش بنعرض أول حرف من الاسم في دايرة ملوّنة
import { useState } from "react";
import { brandDomain, logoSrc } from "@/lib/brand";
import s from "./library.module.css";

export default function BrandLogo({ tool, size = 40 }) {
  const d = brandDomain(tool);
  const [bad, setBad] = useState(!d);
  const letter = (tool.name || "?").trim()[0]?.toUpperCase();
  const px = { width: size, height: size, fontSize: Math.round(size * 0.45) };
  return bad ? (
    <span className={s.logo} style={px} aria-hidden="true">{letter}</span>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={s.logo} style={px} src={logoSrc(d, size > 40 ? 128 : 64)} alt="" width={size} height={size} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} />
  );
}
