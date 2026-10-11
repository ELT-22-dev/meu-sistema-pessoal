import type { Metadata } from 'next';
import ClientsPage from '@/features/clients/clients-page';

export const metadata: Metadata = { title: 'Clientes' };

export default function Page() {
  return <ClientsPage />;
}
