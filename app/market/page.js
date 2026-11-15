import Hub from "@/components/Hub";

export const metadata = {
  title: "ذكاء السوق",
  description: "أسعار المنافسين المنشورة بروابطها وتاريخها، وتحليل المنافسين وإعلاناتهم، ومقارنة الفرص ودراسة الجدوى للتجار وأصحاب الأنشطة.",
  alternates: { canonical: "/market" },
};

export default function Page() {
  return <Hub id="market" />;
}
