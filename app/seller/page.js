import SellerHero from "@/components/seller/SellerHero";
import { ShowcaseFull } from "@/components/seller/Showcase";
import s from "@/components/seller/seller.module.css";

export const metadata = {
  title: "ستوديو البيّاع: كل اللي محتاجه عشان تبيع أونلاين من موبايلك",
  description: "صوّر منتجك وخد صور استوديو وإعلان كامل، اتكلم وخد بوستات، جرّب إعلانك على 100 زبون قبل ما تدفع، واعمل كتالوج PDF بزرار طلب واتساب.",
  alternates: { canonical: "/seller" },
  openGraph: { title: "ستوديو البيّاع", description: "صوّر منتجك وخد صور استوديو وإعلان كامل، اتكلم وخد بوستات، جرّب إعلانك على 100 زبون قبل ما تدفع، واعمل كتالوج PDF بزرار طلب واتساب.", url: "/seller", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: "ستوديو البيّاع", description: "صوّر منتجك وخد صور استوديو وإعلان كامل، اتكلم وخد بوستات، جرّب إعلانك على 100 زبون قبل ما تدفع، واعمل كتالوج PDF بزرار طلب واتساب." },
};

export default function SellerPage() {
  return (
    <>
      <SellerHero
        tone="gold"
        back={false}
        kicker="لأصحاب المشاريع والبياعين أونلاين"
        title="ستوديو"
        accent="البيّاع"
        sub="كل اللي محتاجه عشان تبيع أونلاين، من موبايلك وبالمصري: صور شكل الاستوديو، وبوستات لكل منصة، واختبار إعلانك قبل ما تدفع فيه، وكتالوج يتبعت واتساب."
        steps={["صوّر", "اتكلم", "اختبر", "انشر"]}
      />
      <div className={s.body}>
        <ShowcaseFull />
      </div>
    </>
  );
}
