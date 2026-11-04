import SurveyForm from "@/components/SurveyForm";

export const metadata = {
  title: "استبيان قصير",
  description: "استبيان قصير لمشروع جديد. ردك بيروح لصاحب المشروع على واتساب.",
  robots: { index: false, follow: false },
};

export default function SurveyPage() {
  return <SurveyForm />;
}
