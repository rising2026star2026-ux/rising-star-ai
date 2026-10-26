import MainChat from "@/components/MainChat";
import { tools } from "@/lib/tools";

export const metadata = {
  title: "الشات",
  description: `اسأل أي سؤال بالعربي واحصل على رد فوري، واختار من 6 موديلات، مع اقتراح الأداة المناسبة من ${tools.length} أداة.`,
  alternates: { canonical: "/chat" },
};

export default function ChatPage() {
  return <MainChat />;
}
