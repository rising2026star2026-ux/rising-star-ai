import Link from "next/link";
import Studio from "@/components/prompts/Studio";

const T = "استوديو البرومبتات: فيديو وصور وشات وهوك وإعلانات بالعربي";
const D = "اكتب فكرتك بالعربي وخد برومبت احترافي مظبوط لـ Veo وSora وKling وMidjourney وChatGPT وClaude وGemini، وهوكات للريلز وتيك توك، وإعلانات فيسبوك وإنستجرام وتيك توك من غير أسعار مخترعة.";

export const metadata = {
  title: T,
  description: D,
  alternates: { canonical: "/prompts/studio" },
  openGraph: { title: T, description: D, url: "/prompts/studio", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: T, description: D },
};

export default function Page() {
  return (
    <div style={{ maxWidth: 1040, margin: "0 auto" }}>
      <h1 className="page-title">استوديو البرومبتات</h1>
      <p style={{ color: "var(--muted)", fontSize: "var(--fs-base)", margin: "6px 0 16px", maxWidth: "46em", lineHeight: 1.85 }}>
        اكتب فكرتك بالعربي واختار المولّد، وبنطلّع لك برومبت مكتوب بالصيغة اللي بيفهمها. للمولّد القديم بالمعايير الجاهزة <Link href="/prompts/builder" style={{ color: "var(--blue)", fontWeight: 700 }}>اضغط هنا</Link>.
      </p>
      <Studio />
    </div>
  );
}
