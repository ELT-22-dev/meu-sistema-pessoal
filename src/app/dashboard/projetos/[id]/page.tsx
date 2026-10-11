import { notFound } from 'next/navigation';
import ProjectDetail from '@/features/projects/project-detail';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <ProjectDetail id={id} />;
}
