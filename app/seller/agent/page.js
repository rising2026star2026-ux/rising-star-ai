import SellerAgent from "@/components/seller/SellerAgent";

const description = "اكتب مهمتك بكلامك: وكيل التاجر بيجيب أسعار المنافسين الحقيقية في أمازون مصر ونون وجوميا، ويحسب السعر والمكسب، ويكتب الليستنج والبوستات، ويصمم صور الإعلان من صورة منتجك.";

export const metadata = {
  title: "وكيل التاجر: مهمة كاملة من طلب واحد",
  description,
  alternates: { canonical: "/seller/agent" },
  openGraph: { title: "وكيل التاجر | Rising StarAi", description, url: "/seller/agent", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: "وكيل التاجر | Rising StarAi", description },
};

export default function SellerAgentPage() {
  return <SellerAgent />;
}
