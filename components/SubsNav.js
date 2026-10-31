"use client";
// تبويبات صفحات الاشتراكات
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./subs.module.css";

const ITEMS = [
  { href: "/subscriptions/receipt", label: "🧾 كشف حساب اشتراكاتك" },
  { href: "/subscriptions", label: "مقارن الاشتراكات" },
  { href: "/subscriptions/calculator", label: "أنا محتاج إيه؟" },
  { href: "/scam-check", label: "كاشف النصب" },
];

export default function SubsNav() {
  const path = usePathname() || "";
  return (
    <nav className={s.nav} aria-label="أقسام الاشتراكات">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} className={path === i.href ? s.on : ""} aria-current={path === i.href ? "page" : undefined}>{i.label}</Link>
      ))}
    </nav>
  );
}
