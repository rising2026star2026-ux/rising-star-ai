import SellerHero from "@/components/seller/SellerHero";
import { ShowcaseFull, STAGES } from "@/components/seller/Showcase";
import s from "@/components/seller/seller.module.css";

export const metadata = {
  title: "ستوديو البيّاع: كل اللي محتاجه عشان تبيع أونلاين من موبايلك",
  description: "صوّر منتجك وخد صور استوديو وإعلان كامل، اتكلم وخد بوستات، جرّب إعلانك على 100 عميل افتراضي قبل ما تدفع، واعمل كتالوج PDF بزرار طلب واتساب.",
  alternates: { canonical: "/seller" },
  openGraph: { title: "ستوديو البيّاع", description: "صوّر منتجك وخد صور استوديو وإعلان كامل، اتكلم وخد بوستات، جرّب إعلانك على 100 عميل افتراضي قبل ما تدفع، واعمل كتالوج PDF بزرار طلب واتساب.", url: "/seller", siteName: "Rising Business", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: "ستوديو البيّاع", description: "صوّر منتجك وخد صور استوديو وإعلان كامل، اتكلم وخد بوستات، جرّب إعلانك على 100 عميل افتراضي قبل ما تدفع، واعمل كتالوج PDF بزرار طلب واتساب." },
};

export default function SellerPage() {
  return (
    <>
      <SellerHero
        tone="gold"
        back={false}
        kicker="للتجار والمصنّعين والموزعين والمتاجر الإلكترونية وصناع المحتوى"
        title="ستوديو"
        accent="البيّاع"
        sub={`كل اللي محتاجه عشان تبيع أونلاين، من موبايلك وبالمصري، في ${STAGES.length.toLocaleString("ar-EG")} مراحل: افحص السوق، وصوّر منتجك، واتكلم وخد بوستات، واختبر إعلانك، وانشر كتالوجك، أو وكّل المراحل كلها مرة واحدة.`}
        steps={STAGES}
      />
      <div className={s.body}>
        <ShowcaseFull />
      </div>
    </>
  );
}
