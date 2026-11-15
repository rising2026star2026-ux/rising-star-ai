import BizCompare from "@/components/BizCompare";

export const metadata = {
  title: "مقارنة الأنشطة التجارية",
  description: "قارن من نشاطين لخمسة أنشطة تجارية: رأس المال، التعادل، الربح، فترة الاسترداد والمخاطر، بجداول ورسوم وطريقة حساب واضحة.",
  alternates: { canonical: "/compare-business" },
};

export default function Page() {
  return (
    <>
      <h1 className="page-title">مقارنة الأنشطة التجارية</h1>
      <p className="page-sub">اكتب أرقام كل نشاط، والموقع يحسب ويقارن. أرقامك أنت هي الأساس، ومفيش بيانات سوق مخترعة.</p>
      <BizCompare />
    </>
  );
}
