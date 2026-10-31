import SellerHero from "@/components/seller/SellerHero";
import SubsNav from "@/components/SubsNav";
import Receipt from "@/components/seller/Receipt";

export const metadata = {
  title: "كشف حساب اشتراكاتك: بتدفع كام على الذكاء الاصطناعي؟",
  description: "اختار اشتراكاتك (ChatGPT وClaude وCanva وCapCut وMidjourney...) وخد إيصال بإجمالي اللي بتدفعه بالجنيه، والفلوس اللي بتضيع، وتوفيرك في السنة.",
  alternates: { canonical: "/subscriptions/receipt" },
  openGraph: { title: "كشف حساب اشتراكاتك", description: "اختار اشتراكاتك (ChatGPT وClaude وCanva وCapCut وMidjourney...) وخد إيصال بإجمالي اللي بتدفعه بالجنيه، والفلوس اللي بتضيع، وتوفيرك في السنة.", url: "/subscriptions/receipt", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: "كشف حساب اشتراكاتك", description: "اختار اشتراكاتك (ChatGPT وClaude وCanva وCapCut وMidjourney...) وخد إيصال بإجمالي اللي بتدفعه بالجنيه، والفلوس اللي بتضيع، وتوفيرك في السنة." },
};

export default function ReceiptPage() {
  return (
    <>
      <SellerHero
        tone="rose"
        back={false}
        kicker="في دقيقة"
        title="كشف حساب"
        accent="اشتراكاتك"
        sub="بتدفع كام فعلاً على اشتراكات الذكاء الاصطناعي والتصميم؟ اختار اللي مشترك فيه، وخد إيصال بالإجمالي بالجنيه، والفلوس اللي بتضيع، وهتوفّر كام في السنة."
        steps={["اختار اشتراكاتك", "قول بتستخدمها قد إيه", "اطبع الكشف وشاركه"]}
      />
      <Receipt />
      <div style={{ maxWidth: 860, margin: "18px auto 0" }}><SubsNav /></div>
    </>
  );
}
