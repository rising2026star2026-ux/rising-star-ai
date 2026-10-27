import { Suspense } from "react";
import { tools, categories } from "@/lib/tools";
import { CatalogFromUrl, CatalogStatic } from "@/components/Catalog";
import ExternalLinks from "@/components/ExternalLinks";
import ProgramsGrid from "@/components/ProgramsGrid";
import { APPS } from "@/lib/apps";

export const metadata = {
  title: "كل الأدوات",
  description: `${tools.length} أداة ذكاء اصطناعي بالعربي و${APPS.length} برنامج عالمي بشرح عربي: ChatGPT وClaude وCanva وCapCut وMidjourney وغيرهم.`,
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <>
      <h1 className="page-title">كل الأدوات</h1>
      <p className="page-sub">{tools.length} أداة بالعربي جوه الموقع، و{APPS.length} برنامج عالمي بصفحات عربي.</p>
      <ProgramsGrid />
      <h2 className="page-title" style={{ fontSize: "1.25rem", paddingTop: 30 }}>أدوات الموقع</h2>
      <Suspense fallback={<CatalogStatic />}>
        <CatalogFromUrl />
      </Suspense>
      <div style={{ marginTop: 48 }}>
        <ExternalLinks show={["dirs"]} title="مش لاقي اللي محتاجه؟ دوّر في أدلة الأدوات العالمية" />
      </div>
    </>
  );
}
