import Link from "next/link";
import Research from "@/components/Research";

const description = "باحث أكاديمي بالعربي: بيدوّر في مكتبات أبحاث وكتب حقيقية (OpenAlex وSemantic Scholar وarXiv وOpen Library)، ويكتبلك تقرير بحثي مفصّل لحد 15 صفحة بمراجع حقيقية وروابطها.";

export const metadata = {
  title: "الباحث الأكاديمي: تقرير بحثي بمراجع حقيقية",
  description,
  alternates: { canonical: "/research" },
  openGraph: { title: "الباحث الأكاديمي | Rising StarAi", description, url: "/research", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: "الباحث الأكاديمي | Rising StarAi", description },
};

export default function ResearchPage() {
  return (
    <>
      <h1 className="page-title">الباحث الأكاديمي</h1>
      <p className="page-sub">اكتب موضوع بحثك، وهدوّر في مكتبات الأبحاث والكتب العالمية، وبعدها أكتبلك تقرير مفصّل بمراجع حقيقية تقدر ترجعلها.</p>
      <Link href="/research/chat" className="chat-jump"><span aria-hidden="true">💬</span> توجه للشات المتخصص<small>الشات الأكاديمي: حوار ونقاش بالمصادر</small></Link>
      <Research />
    </>
  );
}
