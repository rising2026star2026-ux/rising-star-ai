import { tools } from "@/lib/tools";
import { SITE_URL } from "@/lib/site";
import { MAKER_LIST } from "@/lib/makers";
import { SECTIONS } from "@/lib/sections";

// خريطة الموقع لجوجل: صفحات الأعمال والتسويق بس (Rising Business)
const PAGES = [
  ["", "weekly", 1],
  ["/seller", "weekly", 0.95],
  ["/seller/agent", "weekly", 0.9],
  ["/compare-business", "monthly", 0.95],
  ["/feasibility", "monthly", 0.9],
  ["/feasibility/chat", "monthly", 0.8],
  ["/market-check", "monthly", 0.9],
  ["/test-ad", "monthly", 0.9],
  ["/photo-ad", "monthly", 0.9],
  ["/voice-post", "monthly", 0.9],
  ["/catalog", "monthly", 0.9],
  ["/amazon", "monthly", 0.9],
  ["/amazon/check", "monthly", 0.9],
  ["/amazon/listing", "monthly", 0.9],
  ["/amazon/profit", "monthly", 0.9],
  ["/amazon/competitor", "monthly", 0.9],
  ["/brand", "monthly", 0.8],
  ["/tools", "weekly", 0.9],
  ["/maker", "weekly", 0.9],
  ["/maker/create", "weekly", 0.9],
  ["/prompts", "weekly", 0.8],
  ["/prompts/studio", "weekly", 0.9],
  ["/prompts/builder", "monthly", 0.8],
  ["/plans", "monthly", 0.6],
  ["/support", "monthly", 0.5],
];

export default function sitemap() {
  const now = new Date();
  const entry = (path, changeFrequency, priority) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });
  return [
    ...PAGES.map(([p, f, n]) => entry(p, f, n)),
    ...SECTIONS.map((x) => entry(`/s/${x.id}`, "weekly", 0.9)),
    ...MAKER_LIST.map((m) => entry(`/maker/${m.slug}`, "monthly", 0.7)),
    ...tools.map((t) => entry(`/tool/${t.id}`, "monthly", 0.7)),
  ];
}
