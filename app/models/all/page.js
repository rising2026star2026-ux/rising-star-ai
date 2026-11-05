import AllModels from "@/components/AllModels";
import { freeModels } from "@/lib/freemodels";

export const metadata = {
  title: "كل الموديلات المفتوحة",
  description: "مئات موديلات الذكاء الاصطناعي المفتوحة للتجربة على Rising StarAi: اختار أي موديل وابدأ الشات معاه.",
  alternates: { canonical: "/models/all" },
};

export const revalidate = 21600;

export default async function Page() {
  const list = await freeModels();
  return <AllModels models={list} />;
}
