import SellerHero from "@/components/seller/SellerHero";
import ProjectsHome from "@/components/projects/ProjectsHome";

const description = "مساحة لكل شغلانة: ارفع ملفاتك (PDF وWord وصور) مرة واحدة واكتب تعليماتك، وكل محادثة في المشروع فاكرة الملفات والتعليمات. للمذاكرة والأبحاث والشغل والمتاجر.";

export const metadata = {
  title: "المشاريع: ملفاتك وتعليماتك ومحادثاتك في مكان واحد",
  description,
  alternates: { canonical: "/projects" },
  openGraph: { title: "المشاريع | Rising StarAi", description, url: "/projects", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: "المشاريع | Rising StarAi", description },
};

export default function ProjectsPage() {
  return (
    <>
      <SellerHero
        tone="cyan"
        back={false}
        kicker="جديد • ملفاتك فاكرها المساعد"
        title="المشاريع:"
        accent="مساحة لكل شغلانة"
        sub="ارفع ملفات المادة أو الشغل مرة واحدة، واكتب للمساعد يشتغل إزاي، وافتح محادثات قد ما تحب. كل محادثة فاكرة الملفات والتعليمات."
        steps={["سمّي المشروع", "ارفع ملفاته", "اكتب تعليماتك", "اسأل في أي وقت"]}
      />
      <ProjectsHome />
    </>
  );
}
