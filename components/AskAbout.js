"use client";
// زرار «اسأل عنه بالعربي»: بيفتح الشات بسؤال جاهز عن البرنامج
import { useRouter } from "next/navigation";
import { write, PENDING_KEY } from "@/lib/store";

export default function AskAbout({ name, className, children }) {
  const router = useRouter();
  function go() {
    const q = `اشرحلي برنامج ${name} بالعربي: بيعمل إيه، وإزاي أبدأ فيه خطوة بخطوة، وأحسن استخدامات ليه، ونصايح عشان أطلع منه أحسن نتيجة.`;
    try { sessionStorage.setItem(PENDING_KEY, q); } catch {}
    write("bot", "");
    router.push("/chat");
  }
  return <button type="button" className={className} onClick={go}>{children}</button>;
}
