import SellerHero from "@/components/seller/SellerHero";
import Hub from "@/components/amazon/Hub";
import sc from "@/components/seller/seller.module.css";

const T = "أدوات بياعين أمازون بالعربي: فاحص رفض، ليستنج، حاسبة ربح، تحليل منافس";
const D = "أربع أدوات لبياعين أمازون مصر والسعودية والإمارات: افحص ليستنجك قبل الرفض، اكتبه بالعربي والإنجليزي من وصف عامي، احسب ربحك الصافي، وحلّل منافسك من تقييماته.";

export const metadata = {
  title: T,
  description: D,
  alternates: { canonical: "/amazon" },
  openGraph: { title: T, description: D, url: "/amazon", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: T, description: D },
};

export default function AmazonPage() {
  return (
    <>
      <SellerHero
        tone="gold"
        kicker="لبياعين أمازون مصر والسعودية والإمارات"
        title="أدوات"
        accent="بيّاع أمازون"
        sub="كل أداة بتحل مشكلة واحدة في دقيقة: تمنع الرفض، وتكتب الليستنج، وتحسب ربحك الحقيقي، وتوريك نقطة ضعف منافسك."
      />
      <div className={sc.body}>
        <Hub />
        <p className={sc.note}>
          <span aria-hidden="true">ℹ️</span>
          <span>الأدوات دي مساعدة مش بديل لأمازون: هي اللي بتقرر قبول الليستنج. الفحص بيعتمد على قواعدها المعلنة، والرسوم في الحاسبة بتكتبها انت من حاسبة الرسوم الرسمية في Seller Central.</span>
        </p>
      </div>
    </>
  );
}
