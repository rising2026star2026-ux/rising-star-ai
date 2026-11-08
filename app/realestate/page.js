import Link from "next/link";
import RealEstate from "@/components/RealEstate";

const description = "الباحث العقاري: أسعار المتر والإيجار في أي منطقة في مصر بمصادرها، وحساب التقسيط والكاش والعائد الإيجاري، ومقارنة الوحدات بتقييم من 100، وقراءة الإعلانات والعقود، وتقرير عقاري محايد.";

export const metadata = {
  title: "الباحث العقاري: أسعار ومقارنة وحسابات عقارات مصر بمصادرها",
  description,
  alternates: { canonical: "/realestate" },
  openGraph: { title: "الباحث العقاري | Rising StarAi", description, url: "/realestate", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: "الباحث العقاري | Rising StarAi", description },
};

export default function RealEstatePage() {
  return (
    <>
      <h1 className="page-title">الباحث العقاري</h1>
      <p className="page-sub">قولّي المنطقة والنوع وهدفك، وهجيبلك أسعار المتر والإيجار من الإعلانات بمصادرها، وأحسبلك الكاش والتقسيط والعائد، وأقارن الوحدات بتقييم من 100. مستشار محايد، مش سمسار.</p>
      <Link href="/realestate/chat" className="chat-jump"><span aria-hidden="true">💬</span> توجه للمستشار العقاري<small>اسأل عن منطقة أو سعر أو عقد</small></Link>
      <RealEstate />
    </>
  );
}
