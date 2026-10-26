import SubsNav from "@/components/SubsNav";
import SubsHub from "@/components/SubsHub";

export const metadata = {
  title: "مقارن الاشتراكات",
  description: "قارن أسعار اشتراكات ChatGPT وClaude وGemini وMidjourney وغيرها بالجنيه المصري، وتابع تغيّر الأسعار، واعرف الأرخص لكل احتياج.",
  alternates: { canonical: "/subscriptions" },
};

export default function SubscriptionsPage() {
  return (
    <>
      <h1 className="page-title">مقارن الاشتراكات</h1>
      <p className="page-sub">أسعار خطط أشهر أدوات الذكاء الاصطناعي بالجنيه، وإيه اللي بتاخده في كل خطة.</p>
      <SubsNav />
      <SubsHub />
    </>
  );
}
