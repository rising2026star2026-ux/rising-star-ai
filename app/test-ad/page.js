import SellerHero from "@/components/seller/SellerHero";
import TestAd from "@/components/seller/TestAd";

export const metadata = {
  title: "جرّب إعلانك على 100 زبون قبل ما تصرف جنيه",
  description: "الصق إعلانك وشوف 100 زبون مصري افتراضي بيعلقوا عليه زي فيسبوك: مين هيطلب ومين هيعدّي وليه، ودرجة من 100، ونسخة محسّنة تختبرها تاني.",
  alternates: { canonical: "/test-ad" },
  openGraph: { title: "جرّب إعلانك على 100 زبون قبل ما تصرف جنيه", description: "الصق إعلانك وشوف 100 زبون مصري افتراضي بيعلقوا عليه زي فيسبوك: مين هيطلب ومين هيعدّي وليه، ودرجة من 100، ونسخة محسّنة تختبرها تاني.", url: "/test-ad", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: "جرّب إعلانك على 100 زبون قبل ما تصرف جنيه", description: "الصق إعلانك وشوف 100 زبون مصري افتراضي بيعلقوا عليه زي فيسبوك: مين هيطلب ومين هيعدّي وليه، ودرجة من 100، ونسخة محسّنة تختبرها تاني." },
};

export default function TestAdPage() {
  return (
    <>
      <SellerHero
        tone="blue"
        kicker="قبل ما تدفع في الإعلان"
        title="جرّب إعلانك على"
        accent="100 زبون"
        sub="الصق إعلانك وشوف زباين مصريين بيعلقوا عليه زي فيسبوك بالظبط: مين هيطلب، ومين بيسأل «بكام؟»، ومين عدّى وليه. وبعدها نسخة أقوى تختبرها تاني."
        steps={["الصق الإعلان وصورته", "الزباين يعلقوا ويحكموا", "خد الدرجة والنسخة الأقوى"]}
      />
      <TestAd />
    </>
  );
}
