'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate, formatMoney, formatMonth, formatNumber, monthRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { SewingPayment } from '@/db/schema';
import {
  deleteSewingEntry,
  deleteSewingPayment,
  lastPricesQuery,
  sewingEntriesQuery,
  sewingModelsQuery,
  sewingMonthlyQuery,
  sewingPaymentsQuery,
  sewingSummaryQuery,
  sewingWorkersQuery,
  type MonthPerson,
  type SewingEntryRow,
  type SewingModelRow,
  type SewingMonth,
  type SewingWorkerRow
} from './api';
import { QuickEntry } from './quick-entry';
import { SewingEntrySheet, SewingPaymentSheet } from './sewing-forms';
import { SEWING_ROLES } from './schema';

const roleLabel = (role: string | null) =>
  role ? (SEWING_ROLES.find((r) => r.value === role)?.label ?? role) : 'overlock / interlock';

/** Quadro de uma pessoa no mês: modelo × quantidade × valor. */
function PersonBlock({ person }: { person: MonthPerson }) {
  const isMe = person.workerId === null;
  return (
    <div className={cn('rounded-lg border p-3', isMe && 'border-primary/40 bg-primary/5')}>
      <div className='mb-2 flex items-baseline justify-between gap-2'>
        <div className='min-w-0 truncate'>
          <span className={cn('font-semibold', isMe ? 'text-primary' : 'text-chart-2')}>
            {person.name}
          </span>{' '}
          <span className='text-muted-foreground text-xs'>· {roleLabel(person.role)}</span>
        </div>
      </div>
      <table className='w-full text-sm'>
        <thead>
          <tr className='text-muted-foreground text-xs'>
            <th className='pb-1 text-left font-medium'>Peça</th>
            <th className='pb-1 text-right font-medium'>Quantidade</th>
            <th className='pb-1 text-right font-medium'>Valor</th>
          </tr>
        </thead>
        <tbody className='tabular-nums'>
          {person.models.map((m) => (
            <tr key={m.modelId} className='border-t'>
              <td className='py-1'>{m.name}</td>
              <td className='py-1 text-right'>{formatNumber(m.pieces)}</td>
              <td className='py-1 text-right'>{formatMoney(m.value)}</td>
            </tr>
          ))}
          <tr className='border-t font-semibold'>
            <td className='pt-1.5'>Total</td>
            <td className='pt-1.5 text-right'>{formatNumber(person.pieces)}</td>
            <td className={cn('pt-1.5 text-right', isMe && 'text-primary')}>
              {formatMoney(person.value)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Lançamentos do mês (para editar/excluir), carregados só quando abertos. */
function MonthEntries({
  month,
  onEdit,
  onDelete
}: {
  month: string;
  onEdit: (e: SewingEntryRow) => void;
  onDelete: (e: SewingEntryRow) => void;
}) {
  const { from, to } = monthRange(month);
  const { data, isLoading } = useQuery(sewingEntriesQuery({ from, to }));
  if (isLoading || !data) return <Skeleton className='h-24 w-full' />;
  return (
    <ul className='divide-y rounded-lg border px-3'>
      {data.map((e) => (
        <li key={e.id} className='flex items-center gap-2 py-1.5 text-sm'>
          <span className='text-muted-foreground w-12 shrink-0 text-xs tabular-nums'>
            {formatDate(e.date, { day: '2-digit', month: '2-digit' })}
          </span>
          <span className='min-w-0 flex-1 truncate'>
            <span className={e.workerId ? 'text-chart-2 font-medium' : 'text-primary font-medium'}>
              {e.workerName ?? 'Eu'}
            </span>{' '}
            · {e.modelName}
            {e.notes && <span className='text-muted-foreground'> — {e.notes}</span>}
          </span>
          <span className='shrink-0 tabular-nums'>
            {formatNumber(e.quantity)} × {formatMoney(e.unitPrice)}
          </span>
          <Button variant='ghost' size='icon-sm' onClick={() => onEdit(e)} aria-label='Editar'>
            <Icons.edit />
          </Button>
          <Button variant='ghost' size='icon-sm' onClick={() => onDelete(e)} aria-label='Excluir'>
            <Icons.trash />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function MonthBox({
  data,
  onEdit,
  onDelete
}: {
  data: SewingMonth;
  onEdit: (e: SewingEntryRow) => void;
  onDelete: (e: SewingEntryRow) => void;
}) {
  const [showEntries, setShowEntries] = useState(false);
  const me = data.people.find((p) => p.workerId === null);
  const team = data.people.filter((p) => p.workerId !== null);
  const teamPieces = team.reduce((s, p) => s + p.pieces, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>{formatMonth(data.month)}</CardTitle>
        <CardDescription>
          {me ? (
            <>
              Eu: {formatNumber(me.pieces)} peças ·{' '}
              <span className='text-primary font-medium'>{formatMoney(me.value)}</span>
            </>
          ) : (
            'Sem produção minha'
          )}
          {team.length > 0 && ` · Equipe: ${formatNumber(teamPieces)} peças`}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          {data.people.map((p) => (
            <PersonBlock key={p.workerId ?? 'eu'} person={p} />
          ))}
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='w-full'
          onClick={() => setShowEntries((v) => !v)}
          aria-expanded={showEntries}
        >
          {showEntries ? 'Ocultar lançamentos' : `Ver / editar lançamentos (${data.entries})`}
          <Icons.chevronDown className={cn('transition-transform', showEntries && 'rotate-180')} />
        </Button>
        {showEntries && <MonthEntries month={data.month} onEdit={onEdit} onDelete={onDelete} />}
      </CardContent>
    </Card>
  );
}

export default function SewingPage() {
  const { data: models = [], isLoading: loadingModels } = useQuery(sewingModelsQuery());
  const { data: workers = [], isLoading: loadingWorkers } = useQuery(sewingWorkersQuery());
  const { data: prices } = useQuery(lastPricesQuery());
  const { data: summary, isLoading: loadingSummary } = useQuery(sewingSummaryQuery());
  const { data: months, isLoading: loadingMonths } = useQuery(sewingMonthlyQuery());
  const { data: payments } = useQuery(sewingPaymentsQuery());

  const [editingEntry, setEditingEntry] = useState<SewingEntryRow | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<SewingEntryRow | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<SewingPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<SewingPayment | null>(null);

  const removeEntry = useApiMutation(deleteSewingEntry, {
    success: 'Lançamento excluído',
    onSuccess: () => setDeletingEntry(null)
  });
  const removePayment = useApiMutation(deleteSewingPayment, {
    success: 'Pagamento excluído',
    onSuccess: () => setDeletingPayment(null)
  });

  return (
    <PageContainer
      pageTitle='Costura'
      pageDescription='Produção por mês — você e cada retista, por tipo de peça.'
      pageHeaderAction={
        <div className='flex gap-2'>
          <Button
            variant='outline'
            aria-label='Equipe'
            render={<Link href='/dashboard/costura/equipe' />}
          >
            <Icons.teams /> <span className='hidden sm:inline'>Equipe</span>
          </Button>
          <Button
            variant='outline'
            aria-label='Modelos'
            render={<Link href='/dashboard/costura/modelos' />}
          >
            <Icons.tag /> <span className='hidden sm:inline'>Modelos</span>
          </Button>
        </div>
      }
    >
      <div className='grid gap-4 lg:grid-cols-5'>
        <div className='lg:col-span-3'>
          {loadingModels || loadingWorkers ? (
            <Skeleton className='h-80 w-full' />
          ) : (
            <QuickEntry models={models} workers={workers} prices={prices} />
          )}
        </div>

        <Card className='bg-primary/5 border-primary/30 lg:col-span-2 lg:self-start'>
          <CardHeader>
            <CardDescription>A receber da oficina (minha produção)</CardDescription>
            <CardTitle className='text-primary text-3xl tabular-nums'>
              {loadingSummary ? <Skeleton className='h-9 w-36' /> : formatMoney(summary?.balance)}
            </CardTitle>
            <CardAction>
              <Button
                size='sm'
                onClick={() => {
                  setEditingPayment(null);
                  setPaymentOpen(true);
                }}
              >
                <Icons.cash /> Recebi
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className='text-muted-foreground space-y-0.5 text-xs'>
            <div>
              Produzido no total: {formatMoney(summary?.produced)} · já recebido:{' '}
              {formatMoney(summary?.paid)}
            </div>
            {summary?.lastPayment && (
              <div>
                Último pagamento: {formatMoney(summary.lastPayment.amount)} em{' '}
                {formatDate(summary.lastPayment.date)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='producao' className='mt-6'>
        <TabsList>
          <TabsTrigger value='producao'>Produção por mês</TabsTrigger>
          <TabsTrigger value='pagamentos'>Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value='producao' className='space-y-4'>
          {loadingMonths && <Skeleton className='h-60 w-full' />}
          {months && months.length === 0 && (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              Nenhuma produção lançada ainda.
            </p>
          )}
          {months?.map((m) => (
            <MonthBox key={m.month} data={m} onEdit={setEditingEntry} onDelete={setDeletingEntry} />
          ))}
        </TabsContent>

        <TabsContent value='pagamentos' className='space-y-2'>
          {(payments ?? []).length === 0 && (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              Nenhum pagamento registrado ainda.
            </p>
          )}
          {(payments ?? []).map((p) => (
            <Card key={p.id} className='flex-row items-center gap-3 px-4 py-3'>
              <div className='min-w-0 flex-1'>
                <div className='font-medium tabular-nums'>{formatMoney(p.amount)}</div>
                <div className='text-muted-foreground text-xs'>
                  Recebido em {formatDate(p.date)}
                  {p.periodStart &&
                    p.periodEnd &&
                    ` · ref. ${formatDate(p.periodStart)} a ${formatDate(p.periodEnd)}`}
                  {p.notes && ` · ${p.notes}`}
                </div>
              </div>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={() => {
                  setEditingPayment(p);
                  setPaymentOpen(true);
                }}
                aria-label='Editar'
              >
                <Icons.edit />
              </Button>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={() => setDeletingPayment(p)}
                aria-label='Excluir'
              >
                <Icons.trash />
              </Button>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {editingEntry && (
        <SewingEntrySheet
          key={editingEntry.id}
          entry={editingEntry}
          models={models as SewingModelRow[]}
          workers={workers as SewingWorkerRow[]}
          open
          onOpenChange={(o) => !o && setEditingEntry(null)}
        />
      )}
      {paymentOpen && (
        <SewingPaymentSheet
          key={editingPayment?.id ?? 'novo'}
          payment={editingPayment}
          balance={summary?.balance ?? 0}
          lastPaymentDate={summary?.lastPayment?.date}
          open
          onOpenChange={setPaymentOpen}
        />
      )}
      <AlertModal
        isOpen={!!deletingEntry}
        onClose={() => setDeletingEntry(null)}
        onConfirm={() => deletingEntry && removeEntry.mutate(deletingEntry.id)}
        loading={removeEntry.isPending}
        title='Excluir lançamento?'
        description={
          deletingEntry
            ? `${deletingEntry.workerName ?? 'Eu'}: ${deletingEntry.quantity} × ${deletingEntry.modelName} em ${formatDate(deletingEntry.date)}`
            : undefined
        }
      />
      <AlertModal
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={() => deletingPayment && removePayment.mutate(deletingPayment.id)}
        loading={removePayment.isPending}
        title='Excluir pagamento?'
        description='A receita correspondente no financeiro também será removida.'
      />
    </PageContainer>
  );
}
