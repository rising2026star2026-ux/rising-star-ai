import SubsNav from "@/components/SubsNav";
import SubsCalculator from "@/components/SubsCalculator";

export const metadata = {
  title: "أنا محتاج إيه؟ حاسبة الاشتراكات",
  description: "اختار احتياجاتك من الذكاء الاصطناعي ومستوى استخدامك، ونطلع لك أقل مجموعة اشتراكات تغطيها وسعرها بالجنيه.",
  alternates: { canonical: "/subscriptions/calculator" },
};

export default function CalculatorPage() {
  return (
    <>
      <h1 className="page-title">أنا محتاج إيه؟</h1>
      <p className="page-sub">حدد احتياجك ونطلع لك أرخص اشتراكات تكفيك، من غير ما تدفع لحاجة مش هتستخدمها.</p>
      <SubsNav />
      <SubsCalculator />
    </>
  );
}
