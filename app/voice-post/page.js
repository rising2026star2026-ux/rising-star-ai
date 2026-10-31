import SellerHero from "@/components/seller/SellerHero";
import VoicePost from "@/components/seller/VoicePost";

export const metadata = {
  title: "اتكلم بس.. واحنا نكتب: من فويس لبوست جاهز",
  description: "سجّل فويس بالمصري عن منتجك، أو ارفع فويس من واتساب، وخد بوست فيسبوك وكابشن إنستجرام ورسالة واتساب وسكريبت ريلز ووصف للمتجر.",
  alternates: { canonical: "/voice-post" },
  openGraph: { title: "اتكلم بس.. واحنا نكتب", url: "/voice-post" },
};

export default function VoicePostPage() {
  return (
    <>
      <SellerHero
        tone="cyan"
        kicker="من غير ما تكتب حرف"
        title="اتكلم بس.."
        accent="واحنا نكتب"
        sub="سجّل فويس عن منتجك زي ما بتشرح لزبون، أو ارفع فويس من واتساب، وخد بوستات جاهزة لكل منصة بالمصري."
        steps={["سجّل أو ارفع فويس", "راجع الكلام", "خد البوستات"]}
      />
      <VoicePost />
    </>
  );
}
