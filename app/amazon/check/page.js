import SellerHero from "@/components/seller/SellerHero";
import CheckTool from "@/components/amazon/CheckTool";

const T = "فاحص رفض ليستنج أمازون: اعرف المشكلة قبل ما أمازون ترفض";
const D = "الصق عنوان ونقاط منتجك واعرف فوراً: الحروف الممنوعة، الكلمات المحظورة بالعربي والإنجليزي، رقم الواتساب، طول العنوان وكلمات البحث بالبايت. وبنصلّح لك الليستنج.";

export const metadata = {
  title: T,
  description: D,
  alternates: { canonical: "/amazon/check" },
  openGraph: { title: T, description: D, url: "/amazon/check", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: T, description: D },
};

export default function Page() {
  return (
    <>
      <SellerHero
        tone="gold"
        kicker="لبياعين أمازون"
        title="فاحص"
        accent="الرفض"
        sub="الصق الليستنج واعرف فوراً اللي هيخلي أمازون ترفضه أو تخبّيه، وخد نسخة نضيفة جاهزة."
        steps={["الصق العنوان والنقاط", "شوف المشاكل فوراً", "خد النسخة المصلّحة"]}
      />
      <CheckTool />
    </>
  );
}
