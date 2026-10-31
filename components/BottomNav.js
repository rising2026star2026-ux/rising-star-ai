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
    href: "/models",
    label: "الموديلات",
    icon: (
      <svg {...P}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" />
        <circle cx="17.2" cy="7" r="3.6" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2.2" />
        <path d="M17.2 13.4l1.1 2.3 2.5.4-1.8 1.7.4 2.5-2.2-1.2-2.2 1.2.4-2.5-1.8-1.7 2.5-.4z" />
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
    href: "/seller",
    label: "البيّاع",
    match: ["/seller", "/test-ad", "/photo-ad", "/voice-post", "/catalog"],
    icon: (
      <svg {...P}>
        <path d="M4 9.5l1.6-4.2A1.5 1.5 0 017 4.3h10a1.5 1.5 0 011.4 1l1.6 4.2" />
        <path d="M4 9.5a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0 2.7 2.7 0 005.3 0" />
        <path d="M5.5 12.5V19a1 1 0 001 1h11a1 1 0 001-1v-6.5M10 20v-4.5h4V20" />
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
