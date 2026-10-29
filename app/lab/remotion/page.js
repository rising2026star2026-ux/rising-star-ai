import Link from "next/link";
import RemotionLoader from "@/components/lab/RemotionLoader";
import d from "@/components/directory.module.css";

export const metadata = {
  title: "تجربة ريلز Remotion",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className={d.toolPage}>
      <nav className={d.crumbs} aria-label="مسار الصفحة"><Link href="/tools">الأدوات</Link><span aria-hidden="true">/</span><span>تجربة Remotion</span></nav>
      <h1 className="page-title">تجربة ريلز بـ Remotion</h1>
      <RemotionLoader />
    </div>
  );
}
