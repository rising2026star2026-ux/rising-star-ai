import SellerAgent from "@/components/seller/SellerAgent";

const description = "اكتب مهمتك بكلامك: وكيل التاجر بيجمع أسعار المنافسين المنشورة في أمازون مصر ونون وجوميا بروابطها وتاريخها، ويحسب السعر والمكسب، ويكتب الليستنج والبوستات، ويصمم صور الإعلان من صورة منتجك.";

export const metadata = {
  title: "وكيل التاجر: مهمة كاملة من طلب واحد",
  description,
  alternates: { canonical: "/seller/agent" },
  openGraph: { title: "وكيل التاجر | Rising Business", description, url: "/seller/agent", siteName: "Rising Business", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: "وكيل التاجر | Rising Business", description },
};

export default function SellerAgentPage() {
  return <SellerAgent />;
}
