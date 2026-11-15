// قايمة التنقل الموحدة حسب PRD 1.0 (القسم 7): 11 عنصر في الشريط الجانبي و5 في الشريط السفلي.
// العنصر الحالي = أطول مسار مطابق (activeOf)، فمفيش مسار بيشغّل عنصرين. scripts/test/nav.test.mjs بيتأكد.
export const SIDE_NAV = [
  { href: "/", label: "لوحة التحكم", exact: true, icon: "M4 13h6V4H4zM14 20h6V11h-6zM4 20h6v-3H4zM14 8h6V4h-6z" },
  { href: "/s/seller", label: "مساعد الأعمال", match: ["/s/seller"], icon: "M20.5 11.5a8.3 8.3 0 01-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1120.5 11.5z" },
  { href: "/market", label: "ذكاء السوق", match: ["/market", "/market-check", "/amazon/competitor", "/survey", "/data-sources"], icon: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2" },
  { href: "/compare-business", label: "مقارنة الأنشطة", match: ["/compare-business"], icon: "M12 4v16M5 8l-2 6h6zM19 8l-2 6h6zM6 20h12" },
  { href: "/feasibility", label: "دراسة الجدوى", match: ["/feasibility"], icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/products", label: "إدارة المنتجات", match: ["/products", "/amazon", "/catalog"], icon: "M20 12l-8 8-9-9V4h7zM7.5 8.5h.01" },
  { href: "/marketing", label: "التسويق والمبيعات", match: ["/marketing", "/seller", "/test-ad", "/voice-post", "/tools", "/tool"], icon: "M3 11v3a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM16 8.5a5 5 0 010 7" },
  { href: "/studio", label: "استوديو الإنتاج التجاري", match: ["/studio", "/photo-ad", "/maker", "/prompts", "/resources", "/lab"], icon: "M4 19.5l4.5-1 10-10a2.1 2.1 0 00-3-3l-10 10zM13.5 7.5l3 3M4 4.5h5M4 8h3" },
  { href: "/my-work", label: "مشروعاتي وتقاريري", match: ["/my-work"], icon: "M3.5 7.5a1.5 1.5 0 011.5-1.5h4l2 2.5h8a1.5 1.5 0 011.5 1.5V18a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 18z" },
  { href: "/brand", label: "ملف النشاط", match: ["/brand"], icon: "M4 7.5A1.5 1.5 0 015.5 6h13A1.5 1.5 0 0120 7.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 16.5zM8 10.5h3M8 14h6" },
  { href: "/plans", label: "الباقات والإعدادات", match: ["/plans"], icon: "M4 8l4 3.5L12 5l4 6.5L20 8l-1.5 10h-13z" },
];

export const TAB_NAV = [
  { href: "/", label: "الرئيسية", exact: true, icon: "M3.5 10.5L12 3.5l8.5 7M5.5 9.5V20h13V9.5" },
  { href: "/market", label: "السوق", match: ["/market", "/market-check", "/amazon/competitor", "/survey", "/data-sources", "/compare-business", "/feasibility"], icon: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2" },
  { href: "/s/seller", label: "المساعد", match: ["/s/seller"], icon: "M20.5 11.5a8.3 8.3 0 01-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1120.5 11.5z" },
  { href: "/my-work", label: "أعمالي", match: ["/my-work", "/brand", "/plans"], icon: "M3.5 7.5a1.5 1.5 0 011.5-1.5h4l2 2.5h8a1.5 1.5 0 011.5 1.5V18a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 18z" },
  { href: "/tools", label: "الأدوات", match: ["/tools", "/tool", "/products", "/amazon", "/catalog", "/marketing", "/seller", "/test-ad", "/voice-post", "/studio", "/photo-ad", "/maker", "/prompts", "/resources", "/lab"], icon: "M14.5 6.5l3-3 3 3-3 3zM4 20l9-9M3.5 7.5h6M6.5 4.5v6M14 17.5h6.5" },
];

const hits = (m, p) => p === m || p.startsWith(m.endsWith("/") ? m : m + "/");

/** العنصر الحالي في قايمة: المطابقة الأطول تكسب (/amazon/competitor للسوق، /amazon للمنتجات) */
export function activeOf(list, pathname) {
  let best = null, len = -1;
  for (const item of list) {
    if (item.exact) { if (pathname === item.href && item.href.length > len) { best = item; len = item.href.length; } continue; }
    for (const m of item.match || [item.href]) if (hits(m, pathname) && m.length > len) { best = item; len = m.length; }
  }
  return best;
}
