import SourceChat from "@/components/SourceChat";

export const metadata = {
  title: "المستشار العقاري: اسأل عن عقد أو تسجيل أو تمويل أو منطقة في مصر",
  description: "شات عقاري محايد: كل رد بيدوّر في سوق العقارات المصري ويعتمد على أرقام تقريرك، ويحسب التقسيط والعائد والإيجار القديم بالكود.",
  alternates: { canonical: "/realestate/chat" },
};

export default function Page() {
  return <SourceChat mode="realestate" />;
}
