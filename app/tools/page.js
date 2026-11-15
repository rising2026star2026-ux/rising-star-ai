import { Suspense } from "react";
import { tools } from "@/lib/tools";
import { CatalogFromUrl, CatalogStatic } from "@/components/Catalog";

export const metadata = {
  title: "أدوات التسويق والمحتوى",
  description: `${tools.length} أداة لأصحاب الأنشطة التجارية: إعلانات ومنشورات ووصف منتجات وردود على العملاء وتصميم صور ولوجو.`,
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <>
      <h1 className="page-title">أدوات التسويق والمحتوى</h1>
      <p className="page-sub">{tools.length} أداة لنشاطك: إعلانات ومنشورات ووصف منتجات وردود على العملاء وتصميم.</p>
      <Suspense fallback={<CatalogStatic />}>
        <CatalogFromUrl />
      </Suspense>
    </>
  );
}
