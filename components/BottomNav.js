"use client";
// شريط التنقل السفلي على الموبايل: الأقسام الخمسة (بيختفي على الشاشات الكبيرة)
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, sectionHome } from "@/lib/sections";
import useSection from "./useSection";
import s from "./nav.module.css";

const P = { viewBox: "0 0 24 24", width: 21, height: 21, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

export default function BottomNav() {
  const pathname = usePathname() || "/";
  const { section } = useSection();

  return (
    <nav className={s.nav} aria-label="الأقسام">
      {SECTIONS.map((x) => {
        const active = section?.id === x.id || pathname === `/s/${x.id}`;
        return (
          <Link key={x.id} href={sectionHome(x.id)} className={`${s.tab} ${active ? s.active : ""}`} aria-current={active ? "page" : undefined}>
            <svg {...P}><path d={x.icon} /></svg>
            <span>{x.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
