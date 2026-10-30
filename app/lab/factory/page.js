import Link from "next/link";
import FactoryLoader from "@/components/lab/FactoryLoader";
import d from "@/components/directory.module.css";

export const metadata = { title: "تجربة مصنع الفيديو", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <div className={d.toolPage}>
      <nav className={d.crumbs} aria-label="مسار الصفحة"><Link href="/tools">الأدوات</Link><span aria-hidden="true">/</span><span>مصنع الفيديو</span></nav>
      <h1 className="page-title">مصنع الفيديو</h1>
      <FactoryLoader />
    </div>
  );
}
