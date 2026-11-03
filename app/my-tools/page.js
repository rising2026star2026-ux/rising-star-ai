import MyTools from "@/components/MyTools";

export const metadata = {
  title: "أدواتي",
  description: "اجمع أدواتك المفضلة في مكان واحد وافتحها كلها بضغطة واحدة.",
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <h1 className="page-title">أدواتي</h1>
      <p className="page-sub">اختار أدواتك، سجّل فيها مرة واحدة بحسابك، وبعد كده افتحها كلها مع بعض بضغطة واحدة.</p>
      <MyTools />
    </>
  );
}
