import SellerHero from "@/components/seller/SellerHero";
import PhotoAd from "@/components/seller/PhotoAd";

export const metadata = {
  title: "صوّرها بموبايلك وخد إعلان كامل",
  description: "صورة منتج عادية من موبايلك تتحول لصور شكل الاستوديو، وبوستات فيسبوك وإنستجرام وواتساب وتيك توك بالمصري، وفيديو إعلان 15 ثانية.",
  alternates: { canonical: "/photo-ad" },
  openGraph: { title: "صوّرها بموبايلك وخد إعلان كامل", url: "/photo-ad" },
};

export default function PhotoAdPage() {
  return (
    <>
      <SellerHero
        tone="gold"
        kicker="من غير مصوّر ولا مصمم"
        title="صوّرها بموبايلك.."
        accent="وخد إعلان كامل"
        sub="صورة عادية لمنتجك، حتى لو على ترابيزة المطبخ، تطلع منها صور شكل الاستوديو، وكلام الإعلان لكل منصة بالمصري، وفيديو للريلز."
        steps={["صوّر المنتج", "خد صور استوديو", "خد البوستات والفيديو"]}
      />
      <PhotoAd />
    </>
  );
}
