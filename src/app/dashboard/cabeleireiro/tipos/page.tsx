import type { Metadata } from 'next';
import HaircutServicesPage from '@/features/haircut/services-page';

export const metadata: Metadata = { title: 'Tipos de corte' };

export default function Page() {
  return <HaircutServicesPage />;
}
