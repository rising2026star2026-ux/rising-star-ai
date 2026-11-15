import { Suspense } from "react";
import { tools } from "@/lib/tools";
import { isCore } from "@/lib/toolroles";
import { BIZ_GROUPS } from "@/lib/bizgroups";

const CORE = tools.filter((t) => isCore(t.id)).length;
const GROUPS = BIZ_GROUPS.filter((g) => g.tools.length).length;
import { CatalogFromUrl, CatalogStatic } from "@/components/Catalog";

export const metadata = {
  title: "أدوات التاجر: المنتجات والتسويق والمبيعات",
  description: `${CORE} أداة تجارية للتجار والمصنّعين والموزعين والمتاجر الإلكترونية وصناع المحتوى: وصف وصور منتجات، إعلانات ومحتوى، ردود على العملاء، خطط عمل ولوجو، وأدوات مساعدة.`,
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <>
      <h1 className="page-title">أدوات التاجر</h1>
      <p className="page-sub">{CORE} أداة تجارية لنشاطك في {GROUPS} مجموعات، و{tools.length - CORE} أداة مساعدة عامة تحتها.</p>
      <Suspense fallback={<CatalogStatic />}>
        <CatalogFromUrl />
      </Suspense>
    </>
  );
}
