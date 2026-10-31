import SellerHero from "@/components/seller/SellerHero";
import Catalog from "@/components/seller/Catalog";

export const metadata = {
  title: "كتالوجك في دقيقة: كتالوج PDF لمنتجاتك بزرار طلب واتساب",
  description: "ارفع صور منتجاتك واكتب الأسعار، وخد كتالوج PDF شيك بأرقام المنتجات وزراير «اطلب» بتفتح واتساب، وصور للحالة والستوري، وكتالوج نصي.",
  alternates: { canonical: "/catalog" },
  openGraph: { title: "كتالوجك في دقيقة", url: "/catalog" },
};

export default function CatalogPage() {
  return (
    <>
      <SellerHero
        tone="green"
        kicker="بدل ما تبعت 30 صورة"
        title="كتالوجك"
        accent="في دقيقة"
        sub="صور منتجاتك تتحول لكتالوج PDF شيك يتبعت على واتساب، وكل منتج له رقم وزرار «اطلب» بيفتح محادثة معاك على طول."
        steps={["ارفع صور المنتجات", "اكتب الأسعار", "حمّل PDF وابعته"]}
      />
      <Catalog />
    </>
  );
}
