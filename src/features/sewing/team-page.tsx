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
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { deleteSewingWorker, sewingWorkersQuery, type SewingWorkerRow } from './api';
import { SEWING_ROLES } from './schema';
import { SewingWorkerSheet } from './sewing-forms';

const roleLabel = (role: string) => SEWING_ROLES.find((r) => r.value === role)?.label ?? role;

export default function TeamPage() {
  const { data, isLoading } = useQuery(sewingWorkersQuery());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SewingWorkerRow | null>(null);
  const [deleting, setDeleting] = useState<SewingWorkerRow | null>(null);
  const remove = useApiMutation(deleteSewingWorker, {
    success: 'Pessoa removida',
    onSuccess: () => setDeleting(null)
  });

  const openForm = (w: SewingWorkerRow | null) => {
    setEditing(w);
    setOpen(true);
  };

  const deleteButton = (w: SewingWorkerRow) => (
    <StopPropagation>
      <Button variant='ghost' size='icon-sm' onClick={() => setDeleting(w)} aria-label='Excluir'>
        <Icons.trash />
      </Button>
    </StopPropagation>
  );

  return (
    <PageContainer
      pageTitle='Equipe'
      pageDescription='Quem costura com você na oficina. A produção de cada um é lançada em Costura → Lançar produção.'
      pageHeaderAction={
        <Button onClick={() => openForm(null)}>
          <Icons.add /> <span className='hidden sm:inline'>Nova pessoa</span>
          <span className='sm:hidden'>Nova</span>
        </Button>
      }
    >
      <DataList
        rows={data}
        isLoading={isLoading}
        getKey={(w) => w.id}
        onRowClick={openForm}
        empty={{
          icon: <Icons.teams />,
          title: 'Ninguém na equipe ainda',
          description: 'Cadastre os retistas (nome e máquina) para registrar a produção deles.',
          action: (
            <Button onClick={() => openForm(null)}>
              <Icons.add /> Nova pessoa
            </Button>
          )
        }}
        columns={[
          {
            header: 'Nome',
            cell: (w) => (
              <div className='flex items-center gap-2'>
                <span className='font-medium'>{w.name}</span>
                {!w.active && <ToneBadge tone='gray'>Inativo</ToneBadge>}
              </div>
            )
          },
          { header: 'Máquina', cell: (w) => roleLabel(w.role) },
          {
            header: 'Hoje',
            className: 'tabular-nums',
            cell: (w) => `${formatNumber(w.todayPieces)} pç`
          },
          {
            header: 'Mês',
            className: 'tabular-nums',
            cell: (w) => (
              <span>
                {formatNumber(w.monthPieces)} pç{' '}
                <span className='text-muted-foreground'>· {formatMoney(w.monthValue)}</span>
              </span>
            )
          },
          {
            header: 'Último lançamento',
            cell: (w) => (w.lastDate ? formatDate(w.lastDate) : '—')
          },
          { header: '', className: 'w-10', cell: deleteButton }
        ]}
        card={(w) => (
          <div className='flex items-center gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <span className='truncate font-medium'>{w.name}</span>
                {!w.active && <ToneBadge tone='gray'>Inativo</ToneBadge>}
              </div>
              <div className='text-muted-foreground text-xs'>
                {roleLabel(w.role)} · hoje {formatNumber(w.todayPieces)} pç
              </div>
            </div>
            <div className='text-right'>
              <div className='font-semibold tabular-nums'>{formatNumber(w.monthPieces)} pç</div>
              <div className='text-muted-foreground text-xs tabular-nums'>
                {formatMoney(w.monthValue)} no mês
              </div>
            </div>
            {deleteButton(w)}
          </div>
        )}
      />

      <SewingWorkerSheet
        key={editing?.id ?? 'nova'}
        worker={editing}
        open={open}
        onOpenChange={setOpen}
      />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title={`Remover ${deleting?.name ?? ''}?`}
        description='Se já tiver produção lançada, desative em vez de excluir (o histórico fica).'
      />
    </PageContainer>
  );
}
