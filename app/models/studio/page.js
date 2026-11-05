import { notFound } from "next/navigation";
import Link from "next/link";
import MediaStudio from "@/components/MediaStudio";
import { findModel } from "@/lib/allmodels";

export const metadata = {
  title: "استوديو الموديلات",
  description: "ولّد صور وصوت بأي موديل من موديلات العالم على Rising StarAi.",
  robots: { index: false },
};

export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const id = typeof sp?.m === "string" ? sp.m : "";
  const model = id ? await findModel(id) : null;
  if (!model) notFound();
  if (model.kind === "text") {
    return (
      <p className="page-sub">
        الموديل ده للشات. <Link href={`/chat?bot=${encodeURIComponent(`or:${model.id}`)}`}>افتحه في الشات</Link>
      </p>
    );
  }
  return <MediaStudio model={model} />;
}
