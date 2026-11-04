import ModelCompare from "@/components/ModelCompare";
import { BOT_SECTIONS } from "@/lib/bots";
import { resolveBots, publicBot } from "@/lib/botcatalog";

const description = "اكتب سؤال واحد وشوف إجابات أكتر من موديل جنب بعض: GPT وClaude وGemini وGrok والموديلات السريعة، واختار الأحسن لشغلك.";

export const metadata = {
  title: "مقارنة الموديلات: سؤال واحد وإجابات جنب بعض",
  description,
  alternates: { canonical: "/compare" },
  openGraph: { title: "مقارنة الموديلات | Rising StarAi", description, url: "/compare", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: "مقارنة الموديلات | Rising StarAi", description },
};

// القايمة بتتحدث لوحدها كل 6 ساعات زي صفحة «الموديلات»
export const revalidate = 21600;

// الأقسام اللي بنقارن فيها: موديلات الكلام بس (من غير المساعدين والبحث والبرامج)
const SECTIONS = ["official", "free", "world"];

export default async function ComparePage() {
  const resolved = await resolveBots();
  const bots = resolved.filter((b) => b.available && SECTIONS.includes(b.section)).map(publicBot);
  const sections = SECTIONS.map((id) => BOT_SECTIONS.find((x) => x.id === id)).filter(Boolean);

  return (
    <>
      <h1 className="page-title">مقارنة الموديلات</h1>
      <p className="page-sub">اكتب سؤالك مرة واحدة، واختار موديلين أو تلاتة، وشوف كل واحد جاوب إزاي. اختار الأحسن واكمل معاه في الشات.</p>
      <ModelCompare bots={bots} sections={sections} />
    </>
  );
}
