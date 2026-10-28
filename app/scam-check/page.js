import SubsNav from "@/components/SubsNav";
import ScamChecker from "@/components/ScamChecker";

export const metadata = {
  title: "كاشف النصب: افحص أي بائع قبل ما تدفع",
  description: "حط لينك موقع البائع أو صفحة الفيسبوك، ونفحص عمر الدومين والأمان ومحتوى الموقع والشكاوى المنشورة، ونطلعلك درجة خطر بالأدلة.",
  alternates: { canonical: "/scam-check" },
};

export default function ScamCheckPage() {
  return (
    <>
      <h1 className="page-title">كاشف النصب</h1>
      <p className="page-sub">حط لينك موقع البائع أو صفحته، وإحنا نفحص ونطلعلك الأدلة ودرجة الخطر.</p>
      <SubsNav />
      <ScamChecker />
    </>
  );
}
