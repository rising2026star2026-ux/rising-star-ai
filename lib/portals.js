// مواقع الإعلانات العقارية المصرية اللي بندوّر فيها. ملف من غير أي imports عشان الصفحات والسيرفر يستخدموه.
// العدد اللي بيظهر للزائر («بدوّر في N مواقع») محسوب من طول القايمة دي، فأي موقع يتضاف هنا يتحسب لوحده.
export const PORTALS = [
  { host: "aqarmap.com.eg", name: "عقار ماب" },
  { host: "propertyfinder.eg", name: "Property Finder" },
  { host: "bayut.eg", name: "بيوت" },
  { host: "nawy.com", name: "نوي" },
  { host: "dubizzle.com.eg", name: "دوبيزل" },
];

export const hostOf = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
};

/** الموقع اللي النتيجة جاية منه، من الرابط أو من اسم الدومين (بعض مزودي البحث بيرجّعوا رابط تحويل والدومين لوحده) */
export function portalOf(url, domain = "") {
  const hosts = [hostOf(url), String(domain || "").replace(/^www\./, "").toLowerCase()].filter(Boolean);
  return PORTALS.find((p) => hosts.some((h) => h === p.host || h.endsWith(`.${p.host}`))) || null;
}
