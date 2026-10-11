import type { Metadata } from 'next';
import SewingPage from '@/features/sewing/sewing-page';

export const metadata: Metadata = { title: 'Costura' };

export default function Page() {
  return <SewingPage />;
}
