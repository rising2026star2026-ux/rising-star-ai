// قايمة التنقل الموحدة: الشريط الجانبي (كمبيوتر) والشريط السفلي (موبايل) بيقروا من هنا.
// match: المسارات اللي بتخلي العنصر "الحالي". scripts/test/nav.test.mjs بيتأكد إن مفيش مسار بيشغّل عنصرين من نفس القايمة.
export const SIDE_NAV = [
  { href: "/", label: "لوحة التحكم", exact: true, icon: "M4 13h6V4H4zM14 20h6V11h-6zM4 20h6v-3H4zM14 8h6V4h-6z" },
  { href: "/brand", label: "ملف النشاط", match: ["/brand"], icon: "M4 7.5A1.5 1.5 0 015.5 6h13A1.5 1.5 0 0120 7.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 16.5zM8 10.5h3M8 14h6" },
  { href: "/my-work", label: "مشروعاتك وتقاريرك", match: ["/my-work"], icon: "M3.5 7.5a1.5 1.5 0 011.5-1.5h4l2 2.5h8a1.5 1.5 0 011.5 1.5V18a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 18z" },
  { href: "/compare-business", label: "مقارنة الأنشطة", match: ["/compare-business"], icon: "M12 4v16M5 8l-2 6h6zM19 8l-2 6h6zM6 20h12" },
  { href: "/feasibility", label: "دراسة الجدوى", match: ["/feasibility"], icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/market-check", label: "السوق والمنافسون", match: ["/market-check", "/amazon/competitor", "/survey"], icon: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2" },
  { href: "/amazon/profit", label: "المنتجات والتسعير", match: ["/amazon", "/catalog"], icon: "M20 12l-8 8-9-9V4h7zM7.5 8.5h.01" },
  { href: "/tools?cat=marketing", label: "التسويق والمحتوى", match: ["/tools", "/tool/", "/photo-ad", "/test-ad", "/voice-post", "/maker", "/prompts", "/resources", "/lab"], icon: "M3 11v3a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM16 8.5a5 5 0 010 7" },
  { href: "/seller", label: "المبيعات والعملاء", match: ["/seller"], icon: "M4 9.5l1.6-4.2A1.5 1.5 0 017 4.3h10a1.5 1.5 0 011.4 1l1.6 4.2M4 9.5a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0 2.7 2.7 0 005.3 0M5.5 12.5V19a1 1 0 001 1h11a1 1 0 001-1v-6.5" },
  { href: "/s/seller", label: "مساعد الأعمال", match: ["/s/seller"], icon: "M20.5 11.5a8.3 8.3 0 01-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1120.5 11.5z" },
];

export const TAB_NAV = [
  { href: "/", label: "الرئيسية", exact: true, icon: "M3.5 10.5L12 3.5l8.5 7M5.5 9.5V20h13V9.5" },
  { href: "/my-work", label: "مشروعاتك", match: ["/my-work", "/brand"], icon: "M3.5 7.5a1.5 1.5 0 011.5-1.5h4l2 2.5h8a1.5 1.5 0 011.5 1.5V18a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 18z" },
  { href: "/compare-business", label: "مقارنة وجدوى", match: ["/compare-business", "/feasibility"], icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/s/seller", label: "مساعد الأعمال", match: ["/s/seller"], icon: "M20.5 11.5a8.3 8.3 0 01-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1120.5 11.5z" },
  { href: "/tools", label: "أدواتي", match: ["/tools", "/tool/", "/seller", "/market-check", "/test-ad", "/photo-ad", "/voice-post", "/catalog", "/amazon", "/survey", "/maker", "/lab", "/prompts", "/resources"], icon: "M14.5 6.5l3-3 3 3-3 3zM4 20l9-9M3.5 7.5h6M6.5 4.5v6M14 17.5h6.5" },
];

export const isOn = (item, pathname) => (item.exact ? pathname === item.href : (item.match || [item.href]).some((m) => pathname === m || pathname.startsWith(m.endsWith("/") ? m : m + "/")));
