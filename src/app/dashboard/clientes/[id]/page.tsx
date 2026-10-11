import { notFound } from 'next/navigation';
import ClientDetail from '@/features/clients/client-detail';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <ClientDetail id={id} />;
}
