'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { DataList, StopPropagation } from '@/components/app/data-list';
import { StatCard } from '@/components/app/stat-card';
import { ToneBadge } from '@/components/app/status-badge';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatMoney, formatMonth } from '@/lib/format';
import { deleteRecurring, recurringQuery, type RecurringRow } from './api';
import { RecurringFormSheet } from './recurring-form';

function Status({ r }: { r: RecurringRow }) {
  if (!r.active) return <ToneBadge tone='gray'>Pausada</ToneBadge>;
  if (r.pendingAmount > 0)
    return <ToneBadge tone='amber'>{formatMoney(r.pendingAmount)} em aberto</ToneBadge>;
  return <ToneBadge tone='green'>Em dia</ToneBadge>;
}

export default function RecurringPage() {
  const { data, isLoading } = useQuery(recurringQuery());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringRow | null>(null);
  const [deleting, setDeleting] = useState<RecurringRow | null>(null);
  const remove = useApiMutation(deleteRecurring, {
    success: 'Mensalidade excluída',
    onSuccess: () => setDeleting(null)
  });

  const active = (data ?? []).filter((r) => r.active);
  const monthly = active.reduce((s, r) => s + r.amount, 0);
  const pending = (data ?? []).reduce((s, r) => s + r.pendingAmount, 0);

  const openForm = (r: RecurringRow | null) => {
    setEditing(r);
    setOpen(true);
  };

  const deleteButton = (r: RecurringRow) => (
    <StopPropagation>
      <Button variant='ghost' size='icon-sm' onClick={() => setDeleting(r)} aria-label='Excluir'>
        <Icons.trash />
      </Button>
    </StopPropagation>
  );

  return (
    <PageContainer
      pageTitle='Mensalidades'
      pageDescription='Cobranças que se repetem todo mês. O sistema lança cada mês como pendente no financeiro.'
      pageHeaderAction={
        <Button onClick={() => openForm(null)}>
          <Icons.add /> <span className='hidden sm:inline'>Nova mensalidade</span>
          <span className='sm:hidden'>Nova</span>
        </Button>
      }
    >
      <div className='mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3'>
        <StatCard
          label='Entra por mês'
          value={formatMoney(monthly)}
          tone='positive'
          loading={isLoading}
          hint={`${active.length} mensalidade(s) ativa(s)`}
        />
        <StatCard
          label='Em aberto (vencidas)'
          value={formatMoney(pending)}
          tone={pending > 0 ? 'negative' : 'default'}
          loading={isLoading}
          hint={
            <Link
              href='/dashboard/financeiro?situacao=pendente'
              className='underline-offset-4 hover:underline'
            >
              Ver no financeiro
            </Link>
          }
        />
      </div>

      <DataList
        rows={data}
        isLoading={isLoading}
        getKey={(r) => r.id}
        onRowClick={openForm}
        empty={{
          icon: <Icons.calendar />,
          title: 'Nenhuma mensalidade',
          description: 'Ex.: manutenção de site R$ 30,00 todo dia 30.',
          action: (
            <Button onClick={() => openForm(null)}>
              <Icons.add /> Nova mensalidade
            </Button>
          )
        }}
        columns={[
          {
            header: 'Mensalidade',
            cell: (r) => (
              <div>
                <div className='font-medium'>{r.description}</div>
                <div className='text-muted-foreground text-xs'>{r.clientName ?? 'Sem cliente'}</div>
              </div>
            )
          },
          { header: 'Dia', className: 'text-center', cell: (r) => `todo dia ${r.dayOfMonth}` },
          {
            header: 'Desde',
            cell: (r) => (
              <span className='text-muted-foreground text-sm'>
                {formatMonth(r.startMonth)}
                {r.endMonth && ` até ${formatMonth(r.endMonth)}`}
              </span>
            )
          },
          { header: 'Situação', cell: (r) => <Status r={r} /> },
          {
            header: 'Valor',
            className: 'text-right font-semibold tabular-nums',
            cell: (r) => formatMoney(r.amount)
          },
          { header: '', className: 'w-10', cell: deleteButton }
        ]}
        card={(r) => (
          <div className='flex items-center gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='truncate font-medium'>{r.description}</div>
              <div className='text-muted-foreground truncate text-xs'>
                {r.clientName ?? 'Sem cliente'} · todo dia {r.dayOfMonth}
              </div>
              <div className='mt-1'>
                <Status r={r} />
              </div>
            </div>
            <span className='text-primary font-semibold tabular-nums'>{formatMoney(r.amount)}</span>
            {deleteButton(r)}
          </div>
        )}
      />

      <RecurringFormSheet
        key={editing?.id ?? 'nova'}
        charge={editing}
        open={open}
        onOpenChange={setOpen}
      />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title='Excluir mensalidade?'
        description='As cobranças já lançadas até este mês continuam no financeiro; as futuras são removidas.'
      />
    </PageContainer>
  );
}
