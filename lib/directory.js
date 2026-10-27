// دليل «أدوات عالمية»: 40 مجال، وكل أداة ليها صفحة بالعربي في /ai/[slug]
// البيانات في data/directory/tools.json وبيعملها السكربت scripts/directory (شوف README هناك):
// بيجمع أسماء وروابط الأدوات، يزور الموقع الرسمي لكل أداة، ياخد الشعار، ويكتب الصفحة بالعربي من كلام الموقع نفسه.
// البرامج الـ70 المشهورة (lib/apps.js) بتظهر كمان جوه مجالاتها وبتفتح صفحتها /program/[slug].
import RAW from "@/data/directory/tools.json";
import { APPS } from "@/lib/apps";

import { DIR_CATEGORIES } from "@/lib/dircats";
export { DIR_CATEGORIES };

export const getDirCategory = (id) => DIR_CATEGORIES.find((c) => c.id === id);

/** نوع التسعير بالعربي */
export const PRICING = {
  free: { label: "مجاني", tone: "free" },
  freemium: { label: "مجاني + خطط مدفوعة", tone: "freemium" },
  trial: { label: "تجربة مجانية ثم مدفوع", tone: "trial" },
  paid: { label: "مدفوع", tone: "paid" },
  unknown: { label: "التسعير على موقع الأداة", tone: "unknown" },
};
export const pricingOf = (t) => PRICING[t?.pricing?.type] || PRICING.unknown;

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

// البرامج الـ70 جوه مجالات الدليل
const APP_CAT = {
  "app-chat": "chatbots", "app-search": "research", "app-image": "image-gen", "app-video": "video-gen",
  "app-audio": "voice", "app-work": "productivity", "app-auto": "agents",
};
const APP_HOSTS = new Set(APPS.map((a) => host(a.url)));
export const DIR_APPS = APPS.map((a) => ({
  slug: a.slug, name: a.name, cat: APP_CAT[a.section] || "chatbots", logo: a.logo, tint: a.tint, mono: a.mono,
  summary: a.desc, href: a.href, pricing: { type: "unknown" }, featured: true,
}));

// أدوات السكربت (من غير تكرار البرامج المشهورة)
export const DIR_TOOLS = (Array.isArray(RAW) ? RAW : [])
  .filter((t) => t && t.slug && t.name && getDirCategory(t.cat) && !APP_HOSTS.has(host(t.url)))
  .map((t) => ({ ...t, href: `/ai/${t.slug}` }));

export const getDirTool = (slug) => DIR_TOOLS.find((t) => t.slug === slug);

/** كل اللي في مجال: المشهورين الأول وبعدهم الباقي */
export function toolsIn(cat) {
  return [...DIR_APPS.filter((a) => a.cat === cat), ...DIR_TOOLS.filter((t) => t.cat === cat)];
}
export const dirCount = (cat) => toolsIn(cat).length;
export const DIR_TOTAL = DIR_APPS.length + DIR_TOOLS.length;

/** نسخة خفيفة للكروت (من غير محتوى الصفحة الكامل) */
export const card = (t) => ({
  slug: t.slug, name: t.name, href: t.href, logo: t.logo || null, tint: t.tint || null, mono: t.mono || null,
  summary: t.summary || "", pricing: t.pricing?.type || "unknown", featured: !!t.featured,
});
