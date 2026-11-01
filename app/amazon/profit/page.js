import SellerHero from "@/components/seller/SellerHero";
import ProfitTool from "@/components/amazon/ProfitTool";

const T = "حاسبة ربح أمازون: هتكسب كام في الوحدة بعد كل الرسوم";
const D = "اكتب سعر البيع وتكلفة الشراء وعمولة أمازون والشحن والإعلانات والمرتجع والضريبة، وشوف ربحك الصافي وأقل سعر من غير خسارة والسعر اللي يحقق هامشك.";

export const metadata = {
  title: T,
  description: D,
  alternates: { canonical: "/amazon/profit" },
  openGraph: { title: T, description: D, url: "/amazon/profit", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: T, description: D },
};

export default function Page() {
  return (
    <>
      <SellerHero
        tone="green"
        kicker="لبياعين أمازون"
        title="حاسبة"
        accent="الربح الصافي"
        sub="هتكسب كام فعلاً في الوحدة بعد العمولة والشحن والإعلانات والمرتجع والضريبة؟ ولازم تبيع بكام عشان تطلع من غير خسارة؟"
        steps={["اكتب أرقامك", "شوف ربحك فوراً", "اعرف السعر المناسب"]}
      />
      <ProfitTool />
    </>
  );
}
