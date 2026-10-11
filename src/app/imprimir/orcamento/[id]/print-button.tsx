'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export function PrintButton() {
  return (
    <Button onClick={() => window.print()}>
      <Icons.printer /> Imprimir / salvar PDF
    </Button>
  );
}
