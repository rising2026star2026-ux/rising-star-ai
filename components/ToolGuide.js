import TryExample from "@/components/TryExample";
import { SHARED_FAQ, STUDIO_FAQ } from "@/lib/content";

// خطوات الاستخدام بتتكتب تلقائياً من بيانات الأداة نفسها
export function howToSteps(tool, content) {
  // أدوات الاستوديو ليها خطواتها الخاصة في ملف المحتوى
  if (tool.local) return content?.steps || [];
  const hint = String(tool.placeholder || "").replace(/(\.{2,}|…)\s*$/u, "").trim();
  const steps = [
    hint && hint !== "اكتب هنا"
      ? `اكتب طلبك في الخانة اللي فوق (${hint}). كل ما كتبت تفاصيل أكتر، النتيجة هتبقى أدق.`
      : "اكتب طلبك في الخانة اللي فوق. كل ما كتبت تفاصيل أكتر، النتيجة هتبقى أدق.",
  ];
  if (tool.option) steps.push(`اختار ${tool.option.label}: ${tool.option.choices.join("، ")}.`);
  steps.push("اضغط «نفّذ»، والنتيجة هتتكتب قدامك في ثواني.");
  steps.push("عدّل النتيجة بزرار زي «أقصر» أو «أبسط»، أو انسخها وابعتها واتساب أو نزّلها Word وPDF.");
  return steps;
}

export function faqFor(content, tool) {
  return [...(content?.faq || []), ...(tool?.local ? STUDIO_FAQ : SHARED_FAQ)];
}

export default function ToolGuide({ tool, content }) {
  if (!content) return null;
  const faq = faqFor(content, tool);

  return (
    <article className="guide" aria-labelledby="guide-title">
      <section className="guide-sec">
        <h2 id="guide-title">عن أداة {tool.name}</h2>
        <p className="guide-about">{content.about}</p>
      </section>

      <section className="guide-sec">
        <h2>تستخدمها في إيه؟</h2>
        <ul className="guide-uses">
          {content.uses.map((u) => <li key={u}>{u}</li>)}
        </ul>
      </section>

      <section className="guide-sec">
        <h2>إزاي تستخدمها؟</h2>
        <ol className="guide-steps">
          {howToSteps(tool, content).map((s) => <li key={s}>{s}</li>)}
        </ol>
      </section>

      {content.example && (
        <section className="guide-sec">
          <h2>{tool.local ? "مثال من الحياة" : "مثال تجربه"}</h2>
          <div className="guide-example">
            <p dir="auto">{content.example}</p>
            {!tool.local && <TryExample text={content.example} />}
          </div>
        </section>
      )}

      <section className="guide-sec">
        <h2>أسئلة شائعة</h2>
        <div className="guide-faq">
          {faq.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}
