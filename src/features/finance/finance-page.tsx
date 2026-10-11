'use client';

import { useState } from 'react';
import Link from 'next/link';
import { parseAsString, useQueryState } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { DataList, StopPropagation } from '@/components/app/data-list';
import {
  FilterBar,
  SearchBox,
  SelectFilter,
  useSearchParam,
  useSelectParam
} from '@/components/app/filters';
import { StatCard } from '@/components/app/stat-card';
import { AreaBadge, PaidBadge } from '@/components/app/status-badge';
import { TX_AREAS, TX_STATUS, TX_TYPES } from '@/config/options';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { currentMonth, formatDate, formatMonth, formatMoney, shiftMonth } from '@/lib/format';
import { cn } from '@/lib/utils';
import { deleteTransaction, financeQuery, setTransactionStatus, type TransactionRow } from './api';
import { TransactionFormSheet } from './transaction-form';

function Amount({ t }: { t: TransactionRow }) {
  return (
    <span
      className={cn(
        'font-semibold whitespace-nowrap tabular-nums',
        t.type === 'receita' ? 'text-primary' : 'text-destructive',
        t.status === 'pendente' && 'opacity-60'
      )}
    >
      {t.type === 'receita' ? '+' : '−'} {formatMoney(t.amount)}
    </span>
  );
}

export default function FinancePage() {
  const [month, setMonth] = useQueryState('mes', parseAsString.withDefault(currentMonth()));
  const { search, value, setValue } = useSearchParam();
  const [type, setType] = useSelectParam('tipo');
  const [area, setArea] = useSelectParam('area');
  const [status, setStatus] = useSelectParam('situacao');
  const { data, isLoading } = useQuery(financeQuery({ month, type, area, status, search }));

  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<'receita' | 'despesa'>('despesa');
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [deleting, setDeleting] = useState<TransactionRow | null>(null);

  const toggle = useApiMutation(setTransactionStatus);
  const remove = useApiMutation(deleteTransaction, {
    success: 'Lançamento excluído',
    onSuccess: () => setDeleting(null)
  });

  const openNew = (t: 'receita' | 'despesa') => {
    setEditing(null);
    setFormType(t);
    setFormOpen(true);
  };
  const openEdit = (t: TransactionRow) => {
    if (t.sewingPaymentId) return;
    setEditing(t);
    setFormOpen(true);
  };

  const s = data?.summary;

  const actions = (t: TransactionRow) =>
    t.sewingPaymentId ? (
      <Button
        variant='ghost'
        size='icon-sm'
        render={<Link href='/dashboard/costura' />}
        aria-label='Ver na costura'
        title='Lançado pela Costura'
      >
        <Icons.sewing />
      </Button>
    ) : (
      <StopPropagation>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger render={<Button variant='ghost' size='icon-sm' />}>
            <span className='sr-only'>Ações</span>
            <Icons.ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() =>
                  toggle.mutate({ id: t.id, status: t.status === 'pago' ? 'pendente' : 'pago' })
                }
              >
                <Icons.check className='mr-2 size-4' />
                {t.status === 'pago' ? 'Marcar como pendente' : 'Marcar como pago'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEdit(t)}>
                <Icons.edit className='mr-2 size-4' /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleting(t)}>
                <Icons.trash className='mr-2 size-4' /> Excluir
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </StopPropagation>
    );

  return (
    <PageContainer
      pageTitle='Financeiro'
      pageDescription='Receitas e despesas de tudo: dev, costura e pessoal.'
      pageHeaderAction={
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => openNew('despesa')} aria-label='Nova despesa'>
            <Icons.expense className='text-destructive' />
            <span className='hidden sm:inline'>Despesa</span>
          </Button>
          <Button onClick={() => openNew('receita')} aria-label='Nova receita'>
            <Icons.income />
            <span className='hidden sm:inline'>Receita</span>
          </Button>
        </div>
      }
    >
      <div className='mb-4 flex items-center justify-between gap-2 sm:justify-start'>
        <Button
          variant='outline'
          size='icon'
          onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label='Mês anterior'
        >
          <Icons.chevronLeft />
        </Button>
        <div className='min-w-40 text-center font-semibold'>{formatMonth(month)}</div>
        <Button
          variant='outline'
          size='icon'
          onClick={() => setMonth(shiftMonth(month, 1))}
          aria-label='Próximo mês'
        >
          <Icons.chevronRight />
        </Button>
        {month !== currentMonth() && (
          <Button variant='ghost' size='sm' onClick={() => setMonth(null)}>
            Hoje
          </Button>
        )}
      </div>

      <div className='mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <StatCard
          label='Receitas pagas'
          value={formatMoney(s?.income)}
          tone='positive'
          loading={isLoading}
          hint={
            s && s.pendingIncome > 0 ? `+ ${formatMoney(s.pendingIncome)} a receber` : undefined
          }
        />
        <StatCard
          label='Despesas pagas'
          value={formatMoney(s?.expense)}
          tone='negative'
          loading={isLoading}
          hint={
            s && s.pendingExpense > 0 ? `+ ${formatMoney(s.pendingExpense)} a pagar` : undefined
          }
        />
        <StatCard
          label='Saldo do mês'
          value={formatMoney(s?.balance)}
          tone={s && s.balance < 0 ? 'negative' : 'default'}
          loading={isLoading}
        />
        <StatCard
          label='Atrasados (meses anteriores)'
          value={formatMoney((data?.overdue.income ?? 0) - (data?.overdue.expense ?? 0))}
          loading={isLoading}
          hint={
            data
              ? `${formatMoney(data.overdue.income)} a receber · ${formatMoney(data.overdue.expense)} a pagar`
              : undefined
          }
        />
      </div>

      <FilterBar>
        <SearchBox value={value} onChange={setValue} placeholder='Buscar descrição ou categoria' />
        <div className='grid grid-cols-3 gap-2 sm:flex'>
          <SelectFilter label='Tipo' value={type} onChange={setType} options={TX_TYPES} />
          <SelectFilter
            label='Área'
            value={area}
            onChange={setArea}
            options={TX_AREAS}
            allLabel='Todas'
          />
          <SelectFilter
            label='Situação'
            value={status}
            onChange={setStatus}
            options={TX_STATUS}
            allLabel='Todas'
          />
        </div>
      </FilterBar>

      <DataList
        rows={data?.items}
        isLoading={isLoading}
        getKey={(t) => t.id}
        onRowClick={openEdit}
        empty={{
          icon: <Icons.wallet />,
          title: 'Nenhum lançamento neste mês',
          description: 'Registre receitas e despesas para acompanhar seu saldo.'
        }}
        columns={[
          { header: 'Data', className: 'w-24', cell: (t) => formatDate(t.date) },
          {
            header: 'Descrição',
            cell: (t) => (
              <div>
                <div className='font-medium'>{t.description}</div>
                <div className='text-muted-foreground text-xs'>
                  {[t.category, t.projectTitle ?? t.clientName].filter(Boolean).join(' · ')}
                </div>
              </div>
            )
          },
          { header: 'Área', cell: (t) => <AreaBadge area={t.area} /> },
          { header: 'Situação', cell: (t) => <PaidBadge status={t.status} /> },
          { header: 'Valor', className: 'text-right', cell: (t) => <Amount t={t} /> },
          { header: '', className: 'w-10', cell: actions }
        ]}
        card={(t) => (
          <div className='flex items-center gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='truncate font-medium'>{t.description}</div>
              <div className='text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-xs'>
                <span>{formatDate(t.date, { day: '2-digit', month: 'short' })}</span>
                <span>· {t.category}</span>
                {t.status === 'pendente' && <PaidBadge status={t.status} />}
              </div>
            </div>
            <Amount t={t} />
            {actions(t)}
          </div>
        )}
      />

      <TransactionFormSheet
        key={editing?.id ?? `novo-${formType}`}
        transaction={editing}
        defaultType={formType}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title='Excluir lançamento?'
        description={
          deleting ? `${deleting.description} — ${formatMoney(deleting.amount)}` : undefined
        }
      />
    </PageContainer>
  );
}
