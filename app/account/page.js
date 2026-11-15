import Account from "@/components/Account";

export const metadata = {
  title: "حسابي",
  description: "سجّل دخولك في Rising Business وانقل ملف نشاطك ودراساتك ومقارناتك من جهازك لحسابك.",
  robots: { index: false },
  alternates: { canonical: "/account" },
};

export default function Page() {
  return (
    <>
      <h1 className="page-title">حسابي</h1>
      <p className="page-sub">حساب واحد لنشاطك، بدل ما بياناتك تفضل على جهاز واحد.</p>
      <Account />
    </>
  );
}
