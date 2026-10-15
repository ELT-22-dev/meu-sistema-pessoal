import type { Metadata } from 'next';
import HaircutPage from '@/features/haircut/haircut-page';

export const metadata: Metadata = { title: 'Cabeleireiro' };

export default function Page() {
  return <HaircutPage />;
}
