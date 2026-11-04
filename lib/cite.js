// صيغة المراجع للباحث الأكاديمي (بتشتغل في المتصفح والسيرفر)
export function citation(s) {
  const au = s.authors?.length ? (s.authors.length > 3 ? `${s.authors.slice(0, 3).join("، ")} وآخرون` : s.authors.join("، ")) : "مؤلف غير مذكور";
  return `${au} (${s.year || "د.ت"}). ${s.title}.${s.venue ? ` ${s.venue}.` : ""}${s.doi ? ` https://doi.org/${s.doi}` : s.url ? ` ${s.url}` : ""}`;
}
