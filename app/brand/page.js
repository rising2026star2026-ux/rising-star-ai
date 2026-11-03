import BrandProfile from "@/components/BrandProfile";

export const metadata = {
  title: "هوية نشاطي",
  description: "اكتب نشاطك ونبرتك وألوانك مرة واحدة، وكل أدوات التسويق والكتابة تشتغل عليها.",
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <h1 className="page-title">هوية نشاطي</h1>
      <p className="page-sub">اكتب بيانات نشاطك مرة واحدة، وبعد كده الأدوات تكتب وتصمم على مقاسه من غير ما تعيد الشرح.</p>
      <BrandProfile />
    </>
  );
}
