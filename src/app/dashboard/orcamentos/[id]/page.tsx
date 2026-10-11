import { notFound } from 'next/navigation';
import QuoteEditor from '@/features/quotes/quote-editor';

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { id: raw } = await params;
  if (raw === 'novo') {
    const clientId = Number((await searchParams).clientId) || undefined;
    return <QuoteEditor id={null} defaultClientId={clientId} />;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <QuoteEditor id={id} />;
}
