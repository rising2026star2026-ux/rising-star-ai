import SourceChat from "@/components/SourceChat";

export const metadata = {
  title: "الشات الأكاديمي: ناقش بحثك بمصادر حقيقية",
  description: "شات متخصص للباحثين والطلبة: حوار ونقاش في موضوع بحثك، وكل رد بيستشهد بأبحاث وكتب من مكتبات عالمية.",
  alternates: { canonical: "/research/chat" },
};

export default function Page() {
  return <SourceChat mode="academic" />;
}
