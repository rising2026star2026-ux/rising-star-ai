import FlowCards from "@/components/FlowCards";
import { FLOWS } from "@/lib/flows";

export const metadata = {
  title: "المهام الكاملة",
  description: `اكتب طلبك مرة واحدة وخد شغل كامل: ${FLOWS.map((f) => f.name).join("، ")}.`,
  alternates: { canonical: "/flows" },
};

export default function FlowsPage() {
  return (
    <>
      <h1 className="page-title">المهام الكاملة</h1>
      <p className="page-sub">اكتب طلبك مرة واحدة، والموقع يشغّل كذا أداة ورا بعض ويسلّمك الشغل كامل.</p>
      <div style={{ marginTop: 22 }}>
        <FlowCards />
      </div>
    </>
  );
}
