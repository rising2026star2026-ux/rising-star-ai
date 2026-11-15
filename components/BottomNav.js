"use client";
// شريط التنقل السفلي على الموبايل (بيختفي على الشاشات الكبيرة): صفحات الأعمال الأساسية
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./nav.module.css";

const P = { viewBox: "0 0 24 24", width: 21, height: 21, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

const TABS = [
  { href: "/", label: "الرئيسية", exact: true, icon: "M3.5 10.5L12 3.5l8.5 7M5.5 9.5V20h13V9.5" },
  { href: "/my-work", label: "مشروعاتي", match: ["/my-work", "/brand"], icon: "M3.5 7.5a1.5 1.5 0 011.5-1.5h4l2 2.5h8a1.5 1.5 0 011.5 1.5V18a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 18z" },
  { href: "/compare-business", label: "مقارنة وجدوى", match: ["/compare-business", "/feasibility"], icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/s/seller", label: "مساعد الأعمال", match: ["/s/seller", "/seller/agent"], icon: "M20.5 11.5a8.3 8.3 0 01-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1120.5 11.5z" },
  { href: "/tools", label: "أدواتي", match: ["/tools", "/tool/", "/seller", "/market-check", "/test-ad", "/photo-ad", "/voice-post", "/catalog", "/amazon", "/survey", "/maker", "/lab", "/prompts", "/resources"], icon: "M14.5 6.5l3-3 3 3-3 3zM4 20l9-9M3.5 7.5h6M6.5 4.5v6M14 17.5h6.5" },
];

const on = (t, p) => (t.exact ? p === t.href : (t.match || [t.href]).some((m) => p === m || p.startsWith(m.endsWith("/") ? m : m + "/")));

export default function BottomNav() {
  const pathname = usePathname() || "/";
  return (
    <nav className={s.nav} aria-label="التنقل">
      {TABS.map((t) => {
        const active = on(t, pathname);
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
