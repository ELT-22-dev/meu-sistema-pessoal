import type { Metadata } from 'next';
import SewingModelsPage from '@/features/sewing/models-page';

export const metadata: Metadata = { title: 'Modelos de peça' };

export default function Page() {
  return <SewingModelsPage />;
}
