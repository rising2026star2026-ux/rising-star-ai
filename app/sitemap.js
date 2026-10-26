import { tools } from "@/lib/tools";
import { FLOWS } from "@/lib/flows";
import { SITE_URL } from "@/lib/site";

// خريطة الموقع لجوجل: الرئيسية والصفحات الأساسية وكل الأدوات
export default function sitemap() {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/chat`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/flows`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...FLOWS.map((f) => ({ url: `${SITE_URL}/flow/${f.id}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 })),
    ...tools.map((t) => ({ url: `${SITE_URL}/tool/${t.id}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 })),
  ];
}
