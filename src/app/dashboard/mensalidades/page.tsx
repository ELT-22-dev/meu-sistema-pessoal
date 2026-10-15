import type { Metadata } from 'next';
import RecurringPage from '@/features/recurring/recurring-page';

export const metadata: Metadata = { title: 'Mensalidades' };

export default function Page() {
  return <RecurringPage />;
}
