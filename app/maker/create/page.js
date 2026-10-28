import Link from "next/link";
import MakerFluxGen from "@/components/MakerFluxGen";
import d from "@/components/directory.module.css";

export const metadata = {
  title: "ولّد صورة من وصف عربي بموديل Flux",
  description: "اكتب فكرتك بالعربي أو بالعامية واطلع صورة احترافية بموديل Flux جوه الموقع، من غير تسجيل ومن غير ما تكتب إنجليزي.",
  alternates: { canonical: "/maker/create" },
};

export default function CreatePage() {
  return (
    <div className={d.toolPage}>
      <nav className={d.crumbs} aria-label="مسار الصفحة">
        <Link href="/maker">صانع الصور والفيديو</Link><span aria-hidden="true">/</span><span>صورة من وصف عربي</span>
      </nav>
      <h1 className="page-title">صورة من وصف عربي</h1>
      <MakerFluxGen />
      <section className={d.box}>
        <h2>نصايح لصورة أحلى</h2>
        <ol>
          <li>قول مين أو إيه في الصورة، وفين، وإمتى (الصبح، الغروب، بالليل).</li>
          <li>زوّد الإحساس أو الستايل: سينمائي، كرتون، ألوان مائية، تصوير منتج.</li>
          <li>Flux بيكتب كلام إنجليزي جوه الصورة كويس، لكن العربي جوه الصورة لسه مش مضمون. استخدم أداة «كتابة على الصور» بعدها.</li>
        </ol>
      </section>
      <p className={d.note}>الموديل FLUX.1 [schnell] من Black Forest Labs مفتوح المصدر ومسموح استخدام صوره تجارياً حسب رخصته (Apache 2.0). الاسم علامة تجارية لأصحابه.</p>
    </div>
  );
}
