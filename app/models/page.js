import ModelsGallery from "@/components/ModelsGallery";
import { BOT_SECTIONS } from "@/lib/bots";
import { APP_SECTIONS, APPS } from "@/lib/apps";
import { resolveBots, publicBot } from "@/lib/botcatalog";
import { tools } from "@/lib/tools";

export const metadata = {
  title: "الموديلات والبرامج",
  description: "كل موديلات وبرامج الذكاء الاصطناعي في مكان واحد وبالعربي: GPT وClaude وGemini وGrok وMidjourney وRunway وSuno وغيرهم.",
  alternates: { canonical: "/models" },
};

// القايمة بتتحدث لوحدها كل 6 ساعات (لما موديل جديد ينزل أو موديل يتقفل)
export const revalidate = 21600;

// برامج الموقع نفسه (استوديو التصميم): أيقونة خطية ولون لكل برنامج
const SITE_APPS = {
  "video-ai": ["video", "#4f46e5"], "video-text": ["film", "#8b5cf6"], "video-photos": ["image", "#ec4899"],
  photo: ["photo", "#0ea5e9"], poster: ["poster", "#f97316"], removebg: ["scissors", "#10b981"],
  resize: ["resize", "#2563eb"], compress: ["compress", "#14b8a6"], convert: ["convert", "#f59e0b"],
  watermark: ["drop", "#0284c7"], colors: ["palette", "#d946ef"], img2pdf: ["pdf", "#ef4444"],
  pdfmerge: ["merge", "#dc2626"], pdfsplit: ["split", "#b91c1c"], frame: ["frame", "#7c3aed"],
  apps: ["apps", "#111827"], adspy: ["spy", "#1d4ed8"],
};

const ORDER = ["official", "world", "free", "search", "app-chat", "app-image", "app-video", "app-audio", "app-work", "app-auto", "assistants", "apps"];

export default async function ModelsPage() {
  const resolved = await resolveBots();
  // الموديل اللي اتشال من Groq بيختفي، والموديلات العالمية اللي لسه مستنية المفتاح بتظهر «قريباً»
  const models = resolved.filter((b) => b.available || b.reason === "soon").map(publicBot);

  const siteApps = tools
    .filter((t) => t.local || t.id === "adspy")
    .map((t) => {
      const [glyph, tint] = SITE_APPS[t.local || t.id] || ["spark", "#4f46e5"];
      return { key: `tool-${t.id}`, section: "apps", name: t.name, maker: "Rising StarAi", desc: t.desc, glyph, tint, href: `/tool/${t.id}`, available: true };
    });

  const all = [...BOT_SECTIONS, ...APP_SECTIONS];
  const sections = ORDER.map((id) => all.find((x) => x.id === id)).filter(Boolean);

  return (
    <>
      <h1 className="page-title">الموديلات والبرامج</h1>
      <p className="page-sub">أشهر موديلات وبرامج الذكاء الاصطناعي في مكان واحد، والمحادثة كلها بالعربي.</p>
      <ModelsGallery sections={sections} bots={[...models, ...APPS, ...siteApps]} />
    </>
  );
}
