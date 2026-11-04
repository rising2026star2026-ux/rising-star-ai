import Feasibility from "@/components/Feasibility";

const description = "الباحث التجاري: دراسة جدوى أولية لمشروعك في مصر (محل، كافيه، مصنع، شركة ناشئة، مخزن) بأسعار السوق الحالية ومنافسين حقيقيين من الخرائط، وحسابات التعادل والاسترداد والسيناريوهات بالكود.";

export const metadata = {
  title: "الباحث التجاري: دراسة جدوى لمشروعك بأرقام السوق المصري",
  description,
  alternates: { canonical: "/feasibility" },
  openGraph: { title: "الباحث التجاري | Rising StarAi", description, url: "/feasibility", siteName: "Rising StarAi", locale: "ar_EG", type: "website" },
  twitter: { card: "summary", title: "الباحث التجاري | Rising StarAi", description },
};

export default function FeasibilityPage() {
  return (
    <>
      <h1 className="page-title">الباحث التجاري</h1>
      <p className="page-sub">قولّي مشروعك وفين، وهدوّر على أسعار السوق والمنافسين، وأحسبلك الاستثمار والتعادل والاسترداد في 3 سيناريوهات، وأكتبلك دراسة جدوى أولية تقدر تعدّل أرقامها.</p>
      <Feasibility />
    </>
  );
}
