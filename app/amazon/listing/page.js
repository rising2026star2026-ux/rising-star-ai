import SellerHero from "@/components/seller/SellerHero";
import ListingTool from "@/components/amazon/ListingTool";

const T = "اكتب ليستنج أمازون بالعربي والإنجليزي من وصف عامي أو صورة";
const D = "اكتب عن منتجك بالعامية أو ارفع صورته واحصل على ليستنج أمازون كامل بالعربي والإنجليزي: عنوان، 5 نقاط، وصف، وكلمات بحث، بعد فحصه على قواعد أمازون.";

export const metadata = {
  title: T,
  description: D,
  alternates: { canonical: "/amazon/listing" },
  openGraph: { title: T, description: D, url: "/amazon/listing", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: T, description: D },
};

export default function Page() {
  return (
    <>
      <SellerHero
        tone="blue"
        kicker="لبياعين أمازون"
        title="ليستنج من"
        accent="كلامك"
        sub="قول عن منتجك بالعامية أو صوّره، وخد عنوان ونقاط ووصف وكلمات بحث بالعربي والإنجليزي، متفحصين على قواعد أمازون."
        steps={["قول عن منتجك", "راجع الأسئلة الناقصة", "انسخ وانشر"]}
      />
      <ListingTool />
    </>
  );
}
