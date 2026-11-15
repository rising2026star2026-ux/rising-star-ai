import MyWork from "@/components/MyWork";

export const metadata = {
  title: "مشروعاتي",
  description: "ملف نشاطك ودراسات الجدوى والمقارنات اللي حفظتها، في مكان واحد.",
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <h1 className="page-title">مشروعاتي</h1>
      <p className="page-sub">دراساتك ومقارناتك المحفوظة، ترجعلها وتعدّل فيها.</p>
      <MyWork />
    </>
  );
}
