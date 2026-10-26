import SubsNav from "@/components/SubsNav";
import ScamChecker from "@/components/ScamChecker";

export const metadata = {
  title: "كاشف نصب الاشتراكات",
  description: "اعرف لو عرض اشتراك ذكاء اصطناعي نصب قبل ما تدفع: علامات الخطر، فاحص نص العرض، وطرق دفع أأمن من مصر.",
  alternates: { canonical: "/scam-check" },
};

export default function ScamCheckPage() {
  return (
    <>
      <h1 className="page-title">كاشف نصب الاشتراكات</h1>
      <p className="page-sub">قبل ما تدفع لأي بائع، اتأكد إن العرض مش نصب.</p>
      <SubsNav />
      <ScamChecker />
    </>
  );
}
