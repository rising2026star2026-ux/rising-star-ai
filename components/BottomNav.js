"use client";
// شريط التنقل السفلي على الموبايل (بيختفي على الشاشات الكبيرة)
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./nav.module.css";

const P = { viewBox: "0 0 24 24", width: 21, height: 21, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

const TABS = [
  {
    href: "/",
    label: "الرئيسية",
    icon: (
      <svg {...P}>
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5 9.8V20h14V9.8" />
      </svg>
    ),
  },
  {
    href: "/chat",
    label: "الشات",
    icon: (
      <svg {...P}>
        <path d="M21 11.5a8.4 8.4 0 01-9 8.4L3 21l1.1-3.6A8.4 8.4 0 1121 11.5z" />
      </svg>
    ),
  },
  {
    href: "/flows",
    label: "المهام",
    match: ["/flows", "/flow/"],
    icon: (
      <svg {...P}>
        <rect x="3" y="4" width="7" height="5" rx="1.5" />
        <rect x="14" y="15" width="7" height="5" rx="1.5" />
        <path d="M6.5 9v3.5a2 2 0 002 2h9V15" />
      </svg>
    ),
  },
  {
    href: "/tools",
    label: "الأدوات",
    match: ["/tools", "/tool/"],
    icon: (
      <svg {...P}>
        <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "السجل",
    icon: (
      <svg {...P}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname() || "/";

  return (
    <nav className={s.nav} aria-label="التنقل">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : (t.match || [t.href]).some((m) => pathname.startsWith(m));
        return (
          <Link key={t.href} href={t.href} className={`${s.tab} ${active ? s.active : ""}`} aria-current={active ? "page" : undefined}>
            {t.icon}
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
