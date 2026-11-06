import SellerHero from "@/components/seller/SellerHero";
import MarketCheck from "@/components/seller/MarketCheck";

const TITLE = "منتجك هيبيع في مصر؟ افحص السوق قبل ما تشتري بضاعة";
const DESC = "اكتب اسم المنتج وسعرك، وشوف أسعار المنافسين الحقيقية في أمازون مصر ونون وجوميا، وعدد التقييمات، وهامش ربحك، ومؤشر فرصة محسوب من بيانات السوق ومعاه المصادر.";

export const metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/market-check" },
  openGraph: { title: TITLE, description: DESC, url: "/market-check", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESC },
};

export default function Page() {
  return (
    <>
      <SellerHero
        tone="green"
        kicker="قبل ما تشتري بضاعة أو تدفع إعلان"
        title="منتجك"
        accent="هيبيع في مصر؟"
        sub="بنجيب أسعار المنافسين الحقيقية من أمازون مصر ونون وجوميا، وعدد التقييمات، ونحسب هامش ربحك، ونقولك فرصتك ومعاها مصدر كل رقم."
        steps={["اكتب المنتج وسعرك", "بندوّر في المتاجر المصرية", "خد المؤشر والمصادر وتعمل إيه"]}
      />
      <MarketCheck />
    </>
  );
}
