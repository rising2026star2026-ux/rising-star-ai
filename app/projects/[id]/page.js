import ProjectWorkspace from "@/components/projects/ProjectWorkspace";

export const metadata = {
  title: "مشروع",
  robots: { index: false, follow: false },
};

export default async function ProjectPage({ params }) {
  const { id } = await params;
  return <ProjectWorkspace id={String(id).slice(0, 40)} />;
}
