import BrandProfile from "@/components/BrandProfile";

export const metadata = {
  title: "ملف النشاط التجاري",
  description: "سجّل نوع نشاطك ومنتجاتك وعملاءك وميزانيتك وأهدافك مرة واحدة، والمقارنة والجدوى ومساعد الأعمال والأدوات تشتغل عليها.",
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <h1 className="page-title">ملف النشاط التجاري</h1>
      <p className="page-sub">اكتب بيانات نشاطك مرة واحدة، وبعد كده الأدوات تكتب وتصمم على مقاسه من غير ما تعيد الشرح.</p>
      <BrandProfile />
    </>
  );
}
