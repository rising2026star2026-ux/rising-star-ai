import MainChat from "@/components/MainChat";
import { tools } from "@/lib/tools";
import { resolveBots, publicBot } from "@/lib/botcatalog";
import { CHAT_PICKS } from "@/lib/bots";

export const metadata = {
  title: "الشات",
  description: `اسأل أي سؤال بالعربي واحصل على رد فوري من Claude وGemini وGPT وDeepSeek وغيرهم، أو دمج أكتر من نموذج، مع اقتراح الأداة المناسبة من ${tools.length} أداة.`,
  alternates: { canonical: "/chat" },
};

// قايمة الموديلات بتتحدث كل 6 ساعات (زي صفحة «الموديلات»)
export const revalidate = 21600;

export default async function ChatPage() {
  const all = await resolveBots();
  const picks = CHAT_PICKS.map((k) => all.find((b) => b.key === k)).filter((b) => b && b.available).map(publicBot);
  return <MainChat chatBots={picks} />;
}
