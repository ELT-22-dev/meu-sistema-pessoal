'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { DataList, StopPropagation } from '@/components/app/data-list';
import { ToneBadge } from '@/components/app/status-badge';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatMoney, formatNumber } from '@/lib/format';
import { deleteHaircutService, haircutServicesQuery, type HaircutServiceRow } from './api';
import { HaircutServiceSheet } from './haircut-forms';

export default function HaircutServicesPage() {
  const { data, isLoading } = useQuery(haircutServicesQuery());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HaircutServiceRow | null>(null);
  const [deleting, setDeleting] = useState<HaircutServiceRow | null>(null);
  const remove = useApiMutation(deleteHaircutService, {
    success: 'Tipo de corte excluído',
    onSuccess: () => setDeleting(null)
  });

  const openForm = (s: HaircutServiceRow | null) => {
    setEditing(s);
    setOpen(true);
  };
  const share = (s: HaircutServiceRow) => (s.price * s.commissionPct) / 100;
  const deleteButton = (s: HaircutServiceRow) => (
    <StopPropagation>
      <Button variant='ghost' size='icon-sm' onClick={() => setDeleting(s)} aria-label='Excluir'>
        <Icons.trash />
      </Button>
    </StopPropagation>
  );

  return (
    <PageContainer
      pageTitle='Tipos de corte'
      pageDescription='Preço do corte e a sua porcentagem. Toque para editar.'
      pageHeaderAction={
        <Button onClick={() => openForm(null)}>
          <Icons.add /> <span className='hidden sm:inline'>Novo tipo</span>
          <span className='sm:hidden'>Novo</span>
        </Button>
      }
    >
      <DataList
        rows={data}
        isLoading={isLoading}
        getKey={(s) => s.id}
        onRowClick={openForm}
        empty={{
          icon: <Icons.scissors />,
          title: 'Nenhum tipo de corte',
          description: 'Ex.: Corte R$ 25 com 50% para você.',
          action: (
            <Button onClick={() => openForm(null)}>
              <Icons.add /> Novo tipo
            </Button>
          )
        }}
        columns={[
          {
            header: 'Tipo',
            cell: (s) => (
              <div className='flex items-center gap-2'>
                <span className='font-medium'>{s.name}</span>
                {!s.active && <ToneBadge tone='gray'>Inativo</ToneBadge>}
              </div>
            )
          },
          { header: 'Preço', className: 'tabular-nums', cell: (s) => formatMoney(s.price) },
          {
            header: 'Minha parte',
            className: 'tabular-nums',
            cell: (s) => `${formatNumber(s.commissionPct)}% = ${formatMoney(share(s))}`
          },
          {
            header: 'Cortes feitos',
            className: 'tabular-nums',
            cell: (s) => formatNumber(s.totalCuts)
          },
          { header: '', className: 'w-10', cell: deleteButton }
        ]}
        card={(s) => (
          <div className='flex items-center gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <span className='truncate font-medium'>{s.name}</span>
                {!s.active && <ToneBadge tone='gray'>Inativo</ToneBadge>}
              </div>
              <div className='text-muted-foreground text-xs'>
                {formatMoney(s.price)} · {formatNumber(s.commissionPct)}% ·{' '}
                {formatNumber(s.totalCuts)} cortes
              </div>
            </div>
            <span className='text-primary font-semibold tabular-nums'>{formatMoney(share(s))}</span>
            {deleteButton(s)}
          </div>
        )}
      />

      <HaircutServiceSheet
        key={editing?.id ?? 'novo'}
        service={editing}
        open={open}
        onOpenChange={setOpen}
      />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title='Excluir tipo de corte?'
        description='Se já tiver cortes lançados com ele, desative em vez de excluir.'
      />
    </PageContainer>
  );
}
