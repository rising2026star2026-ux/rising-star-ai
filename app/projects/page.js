import SellerHero from "@/components/seller/SellerHero";
import ProjectsHome from "@/components/projects/ProjectsHome";

const description = "لكل مادة أو بحث مساحة مستقلة: ارفع المحاضرات والمراجع (PDF وWord وصور) مرة واحدة واكتب تعليماتك، وكل محادثة في المشروع فاكرة ملفاتك وتعليماتك. للطلبة والمدرسين والباحثين.";

export const metadata = {
  title: "المشاريع الدراسية: موادك وأبحاثك وملفاتك في مكان واحد",
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
        kicker="جديد • المساعد فاكر ملفاتك"
        title="مشاريعك الدراسية:"
        accent="لكل مادة وبحث مساحة مستقلة"
        sub="ارفع المحاضرات والمراجع مرة واحدة، واكتب للمساعد يساعدك إزاي، وافتح محادثات قد ما تحب. كل محادثة فاكرة ملفاتك وتعليماتك."
        steps={["سمّي المادة أو البحث", "ارفع المحاضرات والمراجع", "اكتب تعليماتك", "اسأل في أي وقت"]}
      />
      <ProjectsHome />
    </>
  );
}
