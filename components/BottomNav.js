"use client";
// شريط التنقل السفلي على الموبايل (بيختفي على الشاشات الكبيرة): صفحات الأعمال الأساسية
import { TAB_NAV, isOn } from "@/lib/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./nav.module.css";

const P = { viewBox: "0 0 24 24", width: 21, height: 21, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };



export default function BottomNav() {
  const pathname = usePathname() || "/";
  return (
    <nav className={s.nav} aria-label="التنقل">
      {TAB_NAV.map((t) => {
        const active = isOn(t, pathname);
        return (
          <Link key={t.href} href={t.href} className={`${s.tab} ${active ? s.active : ""}`} aria-current={active ? "page" : undefined}>
            <svg {...P}><path d={t.icon} /></svg>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
