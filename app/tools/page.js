import { Suspense } from "react";
import { tools, categories } from "@/lib/tools";
import { CatalogFromUrl, CatalogStatic } from "@/components/Catalog";
import ExternalLinks from "@/components/ExternalLinks";

export const metadata = {
  title: "كل الأدوات",
  description: `${tools.length} أداة ذكاء اصطناعي بالعربي في ${categories.length} مجال: كتابة، تسويق، سوشيال ميديا، تعليم، ترجمة، برمجة، وظائف، وأكتر.`,
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <>
      <h1 className="page-title">كل الأدوات</h1>
      <p className="page-sub">{tools.length} أداة في {categories.length} مجال. اختار المجال أو دوّر بالاسم.</p>
      <Suspense fallback={<CatalogStatic />}>
        <CatalogFromUrl />
      </Suspense>
      <div style={{ marginTop: 48 }}>
        <ExternalLinks show={["dirs"]} title="مش لاقي اللي محتاجه؟ دوّر في أدلة الأدوات العالمية" />
      </div>
    </>
  );
}
