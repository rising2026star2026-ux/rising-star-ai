"use client";
// شريط التنقل السفلي على الموبايل (بيختفي على الشاشات الكبيرة): صفحات الأعمال الأساسية
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./nav.module.css";

const P = { viewBox: "0 0 24 24", width: 21, height: 21, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

const TABS = [
  { href: "/", label: "الرئيسية", exact: true, icon: "M3.5 10.5L12 3.5l8.5 7M5.5 9.5V20h13V9.5" },
  { href: "/s/seller", label: "مساعد الأعمال", match: ["/s/seller"], icon: "M20.5 11.5a8.3 8.3 0 01-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1120.5 11.5z" },
  { href: "/seller", label: "ستوديو البيّاع", match: ["/seller", "/market-check", "/test-ad", "/photo-ad", "/voice-post", "/catalog", "/amazon", "/survey", "/brand"], icon: "M4 9.5l1.6-4.2A1.5 1.5 0 017 4.3h10a1.5 1.5 0 011.4 1l1.6 4.2M4 9.5a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0 2.7 2.7 0 005.3 0M5.5 12.5V19a1 1 0 001 1h11a1 1 0 001-1v-6.5M10 20v-4.5h4V20" },
  { href: "/feasibility", label: "دراسة الجدوى", match: ["/feasibility"], icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/tools", label: "الأدوات", match: ["/tools", "/tool/", "/maker", "/lab", "/prompts", "/resources"], icon: "M14.5 6.5l3-3 3 3-3 3zM4 20l9-9M3.5 7.5h6M6.5 4.5v6M14 17.5h6.5" },
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
