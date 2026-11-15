import Hub from "@/components/Hub";

export const metadata = {
  title: "التسويق والمبيعات",
  description: "خطة تسويق، إعلانات ومنشورات، اختبار إعلان على عملاء افتراضيين، وردود واتساب وتقييمات على مقاس نشاطك.",
  alternates: { canonical: "/marketing" },
};

export default function Page() {
  return <Hub id="marketing" />;
}
