import SubsNav from "@/components/SubsNav";
import SubsHub from "@/components/SubsHub";
import { SUB_TOOLS } from "@/lib/subscriptions";

export const metadata = {
  title: "مقارن الاشتراكات",
  description: `قارن أسعار ${SUB_TOOLS.length} اشتراك ذكاء اصطناعي بالجنيه المصري: ChatGPT وClaude وGemini وMidjourney وKling وCapCut وغيرها، وتابع تغيّر الأسعار، واعرف الأرخص لكل احتياج.`,
  alternates: { canonical: "/subscriptions" },
};

export default function SubscriptionsPage() {
  return (
    <>
      <h1 className="page-title">مقارن الاشتراكات</h1>
      <p className="page-sub">أسعار {SUB_TOOLS.length} أداة ذكاء اصطناعي بالجنيه، وإيه اللي بتاخده في كل خطة.</p>
      <SubsNav />
      <SubsHub />
    </>
  );
}
