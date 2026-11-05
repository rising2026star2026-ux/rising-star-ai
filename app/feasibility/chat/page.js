import SourceChat from "@/components/SourceChat";

export const metadata = {
  title: "الشات التجاري: ناقش مشروعك بأرقام السوق المصري",
  description: "شات متخصص لأصحاب المشروعات: حوار عن مشروعك وسوقك، وكل رد بيدوّر في السوق المصري ويعتمد على أرقام دراسة الجدوى بتاعتك.",
  alternates: { canonical: "/feasibility/chat" },
};

export default function Page() {
  return <SourceChat mode="business" />;
}
