'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { DataList } from '@/components/app/data-list';
import {
  FilterBar,
  SearchBox,
  SelectFilter,
  useSearchParam,
  useSelectParam
} from '@/components/app/filters';
import { QuoteStatusBadge } from '@/components/app/status-badge';
import { QUOTE_STATUS } from '@/config/options';
import { formatDate, formatMoney } from '@/lib/format';
import { quotesQuery } from './api';

export default function QuotesPage() {
  const router = useRouter();
  const { search, value, setValue } = useSearchParam();
  const [status, setStatus] = useSelectParam('status');
  const { data, isLoading } = useQuery(quotesQuery({ search, status }));

  const newButton = (
    <Button render={<Link href='/dashboard/orcamentos/novo' />}>
      <Icons.add /> <span className='hidden sm:inline'>Novo orçamento</span>
      <span className='sm:hidden'>Novo</span>
    </Button>
  );

  return (
    <PageContainer
      pageTitle='Orçamentos'
      pageDescription='Propostas para clientes — aprovou, vira projeto.'
      pageHeaderAction={newButton}
    >
      <FilterBar>
        <SearchBox value={value} onChange={setValue} placeholder='Buscar título ou cliente' />
        <SelectFilter label='Status' value={status} onChange={setStatus} options={QUOTE_STATUS} />
      </FilterBar>

      <DataList
        rows={data}
        isLoading={isLoading}
        getKey={(q) => q.id}
        onRowClick={(q) => router.push(`/dashboard/orcamentos/${q.id}`)}
        empty={{
          icon: <Icons.quote />,
          title: 'Nenhum orçamento',
          description: search || status ? 'Ajuste os filtros.' : 'Monte sua primeira proposta.',
          action: !(search || status) && newButton
        }}
        columns={[
          {
            header: 'Orçamento',
            cell: (q) => (
              <div>
                <div className='font-medium'>{q.title}</div>
                <div className='text-muted-foreground text-xs'>
                  #{q.id} · {q.clientName ?? 'Sem cliente'}
                </div>
              </div>
            )
          },
          { header: 'Status', cell: (q) => <QuoteStatusBadge status={q.status} /> },
          { header: 'Criado em', cell: (q) => formatDate(q.createdAt) },
          { header: 'Validade', cell: (q) => (q.validUntil ? formatDate(q.validUntil) : '—') },
          {
            header: 'Total',
            className: 'text-right tabular-nums font-medium',
            cell: (q) => formatMoney(q.total)
          }
        ]}
        card={(q) => (
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <div className='truncate font-medium'>{q.title}</div>
              <div className='text-muted-foreground truncate text-xs'>
                #{q.id} · {q.clientName ?? 'Sem cliente'} · {formatDate(q.createdAt)}
              </div>
            </div>
            <div className='flex flex-col items-end gap-1'>
              <span className='font-semibold tabular-nums'>{formatMoney(q.total)}</span>
              <QuoteStatusBadge status={q.status} />
            </div>
          </div>
        )}
      />
    </PageContainer>
  );
}
