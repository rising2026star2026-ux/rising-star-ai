import Builder from "@/components/prompts/Builder";

const T = "مولّد البرومبتات: ابنِ برومبت احترافي أو ولّد 100 فكرة جديدة";
const D = "مولّد برومبتات بالعربي: اختار النوع (شات، إعلان، ريلز، صورة، فيديو) والمعايير وخد برومبت منظم فوراً، أو ولّد من 10 لـ100 برومبت جديد لمجالك، أو حسّن برومبت ضعيف.";

export const metadata = {
  title: T,
  description: D,
  alternates: { canonical: "/prompts/builder" },
  openGraph: { title: T, description: D, url: "/prompts/builder", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: T, description: D },
};

export default function Page() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <h1 className="page-title">مولّد البرومبتات</h1>
      <p style={{ color: "var(--muted)", fontSize: "0.95rem", margin: "6px 0 16px", maxWidth: "46em", lineHeight: 1.85 }}>
        بدل برومبتات جاهزة ثابتة: اختار اللي محتاجه وهيتبني لك برومبت منظم فوراً، أو ولّد عشرات الأفكار الجديدة لمجالك بمعاييرك، أو الصق برومبت ضعيف ونحسّنه.
      </p>
      <Builder />
    </div>
  );
}
