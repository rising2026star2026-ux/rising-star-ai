import { tools } from "@/lib/tools";
import { APPS } from "@/lib/apps";
import { FLOWS } from "@/lib/flows";
import { SITE_URL } from "@/lib/site";
import { MAKER_LIST } from "@/lib/makers";
import { CREATORS } from "@/lib/creators";
import { DIR_CATEGORIES, DIR_TOOLS } from "@/lib/directory";

// خريطة الموقع لجوجل: الرئيسية والصفحات الأساسية وكل الأدوات
export default function sitemap() {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/chat`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/models`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/subscriptions`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/subscriptions/calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/scam-check`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/flows`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/maker`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/maker/create`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...MAKER_LIST.map((m) => ({ url: `${SITE_URL}/maker/${m.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 })),
    { url: `${SITE_URL}/learn`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/news`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/creators`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...CREATORS.map((c) => ({ url: `${SITE_URL}/creators/${c.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 })),
    { url: `${SITE_URL}/global-tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...DIR_CATEGORIES.map((c) => ({ url: `${SITE_URL}/global-tools/${c.id}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 })),
    ...DIR_TOOLS.map((t) => ({ url: `${SITE_URL}/ai/${t.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 })),
    ...FLOWS.map((f) => ({ url: `${SITE_URL}/flow/${f.id}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 })),
    ...APPS.map((a) => ({ url: `${SITE_URL}/program/${a.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 })),
    ...tools.map((t) => ({ url: `${SITE_URL}/tool/${t.id}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 })),
  ];
}
