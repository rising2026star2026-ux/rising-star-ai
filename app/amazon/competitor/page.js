import SellerHero from "@/components/seller/SellerHero";
import CompetitorTool from "@/components/amazon/CompetitorTool";

const T = "تحليل منافس أمازون من تقييماته: نقاط ضعفه وإزاي تتفوق";
const D = "الصق ليستنج منتج منافس على أمازون وتقييماته واعرف شكاوي عملائه بالدليل، والكلمات الناقصة عندك، ونقاط جاهزة تعالج المشاكل دي.";

export const metadata = {
  title: T,
  description: D,
  alternates: { canonical: "/amazon/competitor" },
  openGraph: { title: T, description: D, url: "/amazon/competitor", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: T, description: D },
};

export default function Page() {
  return (
    <>
      <SellerHero
        tone="rose"
        kicker="لبياعين أمازون"
        title="تحليل"
        accent="المنافس"
        sub="الصق ليستنج منافسك وتقييمات عملائه، وهنطلّع لك نقاط ضعفه بالدليل، وزوايا تتفوق بيها، ونقاط جاهزة لمنتجك."
        steps={["الصق ليستنجه وتقييماته", "شوف شكاوي عملائه", "اكتب اللي يتفوق عليه"]}
      />
      <CompetitorTool />
    </>
  );
}
