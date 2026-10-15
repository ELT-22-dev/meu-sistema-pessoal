'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const SEGMENT_TITLES: Record<string, string> = {
  dashboard: 'Início',
  projetos: 'Projetos',
  clientes: 'Clientes',
  orcamentos: 'Orçamentos',
  costura: 'Costura',
  modelos: 'Modelos',
  equipe: 'Equipe',
  agenda: 'Agenda',
  mensalidades: 'Mensalidades',
  financeiro: 'Financeiro',
  novo: 'Novo'
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: SEGMENT_TITLES[segment] ?? (/^\d+$/.test(segment) ? `#${segment}` : segment),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
