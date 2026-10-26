import ModelsGallery from "@/components/ModelsGallery";
import { BOT_SECTIONS } from "@/lib/bots";
import { resolveBots, publicBot } from "@/lib/botcatalog";

export const metadata = {
  title: "الموديلات",
  description: "كل موديلات الذكاء الاصطناعي في مكان واحد وبالعربي: GPT وClaude وGemini وGrok وموديلات مجانية وبحث على الإنترنت.",
  alternates: { canonical: "/models" },
};

// القايمة بتتحدث لوحدها كل 6 ساعات (لما موديل جديد ينزل أو موديل يتقفل)
export const revalidate = 21600;

export default async function ModelsPage() {
  const bots = (await resolveBots()).map(publicBot);
  return (
    <>
      <h1 className="page-title">الموديلات</h1>
      <p className="page-sub">اختار الموديل اللي يناسبك، والمحادثة كلها بالعربي.</p>
      <ModelsGallery sections={BOT_SECTIONS} bots={bots} />
    </>
  );
}
