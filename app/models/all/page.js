import AllModels from "@/components/AllModels";
import { allModels } from "@/lib/allmodels";

export const metadata = {
  title: "كل الموديلات المفتوحة",
  description: "مئات موديلات الذكاء الاصطناعي للشات والصور والصوت على Rising StarAi: اختار أي موديل وابدأ على طول.",
  alternates: { canonical: "/models/all" },
};

export const revalidate = 21600;

export default async function Page() {
  // بنبعت للمتصفح اللي الصفحة محتاجاه بس
  const list = (await allModels()).map(({ params, inputs, textOut, created, ...m }) => m);
  return <AllModels models={list} />;
}
