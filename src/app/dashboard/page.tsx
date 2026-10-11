import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import OverviewPage from '@/features/overview/overview-page';

export const metadata: Metadata = { title: 'Início' };

export default async function Page() {
  const session = await getSession();
  return <OverviewPage name={session?.name ?? ''} />;
}
