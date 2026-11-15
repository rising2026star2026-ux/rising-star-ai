import MyWork from "@/components/MyWork";

export const metadata = {
  title: "مشروعاتك وتقاريرك",
  description: "ملف نشاطك ودراسات الجدوى والمقارنات اللي حفظتها، في مكان واحد.",
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <h1 className="page-title">مشروعاتك وتقاريرك</h1>
      <p className="page-sub">كل اللي حفظته: الدراسات والمقارنات والمنتجات وخطط التسويق والتقارير والمحادثات.</p>
      <MyWork />
    </>
  );
}
