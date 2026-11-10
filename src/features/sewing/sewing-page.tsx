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
import {
  currentMonth,
  formatDate,
  formatMoney,
  formatMonth,
  formatNumber,
  monthRange,
  shiftMonth
} from '@/lib/format';
import { cn } from '@/lib/utils';
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
  type MonthPayment,
  type MonthPerson,
  type SewingEntryRow,
  type SewingModelRow,
  type SewingMonth,
  type SewingWorkerRow
} from './api';
import { QuickEntry } from './quick-entry';
import { SewingEntrySheet, SewingPaymentSheet, type PaymentFormValues } from './sewing-forms';
import { paymentKindLabel, SEWING_ROLES, type SewingPaymentKind } from './schema';

/** O que abre o formulário de recebimento: uma anotação existente ou valores iniciais. */
type PaymentSheetState = {
  payment?: PaymentFormValues;
  month?: string;
  kind?: SewingPaymentKind;
  amount?: number;
};

const KIND_STYLE: Record<string, string> = {
  pagamento: 'bg-primary/10 text-primary',
  adiantamento: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  vale: 'bg-chart-5/15 text-chart-5'
};

function KindTag({ kind }: { kind: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded px-1.5 py-0.5 text-[11px] leading-none font-medium',
        KIND_STYLE[kind] ?? KIND_STYLE.pagamento
      )}
    >
      {paymentKindLabel(kind)}
    </span>
  );
}

function balanceLabel(balance: number, month: string) {
  const next = formatMonth(shiftMonth(month, 1)).toLowerCase();
  if (balance > 0) return { title: 'Falta receber', hint: `passa para ${next}` };
  if (balance < 0) return { title: 'Recebido a mais', hint: `desconta em ${next}` };
  return { title: 'Mês acertado', hint: null };
}

const moneyTone = (v: number) => cn(v > 0 && 'text-primary', v < 0 && 'text-destructive');

/** Meu acerto com a oficina no mês: saldo anterior + produção − recebimentos = saldo. */
function MonthLedger({
  data,
  onAddPayment,
  onEditPayment,
  onDeletePayment
}: {
  data: SewingMonth;
  onAddPayment: (s: PaymentSheetState) => void;
  onEditPayment: (p: MonthPayment) => void;
  onDeletePayment: (p: MonthPayment) => void;
}) {
  const label = balanceLabel(data.balance, data.month);
  return (
    <div className='panel-3d rounded-lg border p-3'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <span className='font-semibold'>Meu acerto do mês</span>
        <Button
          size='sm'
          variant='outline'
          onClick={() =>
            onAddPayment({
              month: data.month,
              kind: 'pagamento',
              amount: data.balance > 0 ? data.balance : undefined
            })
          }
        >
          <Icons.add /> Anotar
        </Button>
      </div>
      <table className='w-full text-sm'>
        <tbody className='tabular-nums'>
          {data.previousBalance !== 0 && (
            <tr>
              <td className='py-1'>Saldo do mês anterior</td>
              <td
                className={cn(
                  'py-1 text-right whitespace-nowrap',
                  data.previousBalance < 0 && 'text-destructive'
                )}
              >
                {formatMoney(data.previousBalance)}
              </td>
              <td aria-hidden='true' className='w-16' />
            </tr>
          )}
          <tr className={cn(data.previousBalance !== 0 && 'border-t')}>
            <td className='py-1'>Produção do mês</td>
            <td className='py-1 text-right whitespace-nowrap'>+ {formatMoney(data.produced)}</td>
            <td aria-hidden='true' className='w-16' />
          </tr>
          {data.payments.map((p) => (
            <tr key={p.id} className='border-t'>
              <td className='max-w-0 py-1'>
                <div className='flex min-w-0 items-center gap-1.5'>
                  <KindTag kind={p.kind} />
                  <span className='text-muted-foreground min-w-0 truncate text-xs'>
                    {formatDate(p.date, { day: '2-digit', month: '2-digit' })}
                    {p.notes && ` · ${p.notes}`}
                  </span>
                </div>
              </td>
              <td className='py-1 text-right whitespace-nowrap'>− {formatMoney(p.amount)}</td>
              <td className='w-16 py-0.5 text-right whitespace-nowrap'>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  onClick={() => onEditPayment(p)}
                  aria-label='Editar'
                >
                  <Icons.edit />
                </Button>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  onClick={() => onDeletePayment(p)}
                  aria-label='Excluir'
                >
                  <Icons.trash />
                </Button>
              </td>
            </tr>
          ))}
          {data.payments.length === 0 && (
            <tr className='border-t'>
              <td colSpan={3} className='text-muted-foreground py-1.5 text-xs'>
                Nenhum pagamento, adiantamento ou vale anotado neste mês.
              </td>
            </tr>
          )}
          <tr className='border-t font-semibold'>
            <td className='pt-1.5'>
              {label.title}
              {label.hint && (
                <div className='text-muted-foreground text-xs font-normal'>{label.hint}</div>
              )}
            </td>
            <td
              className={cn(
                'pt-1.5 text-right align-top whitespace-nowrap',
                moneyTone(data.balance)
              )}
            >
              {formatMoney(data.balance)}
            </td>
            <td aria-hidden='true' className='w-16' />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const roleLabel = (role: string | null) =>
  role ? (SEWING_ROLES.find((r) => r.value === role)?.label ?? role) : 'overlock / interlock';

/** Quadro de uma pessoa no mês: modelo × quantidade × valor. */
function PersonBlock({ person }: { person: MonthPerson }) {
  const isMe = person.workerId === null;
  return (
    <div className={cn('panel-3d rounded-lg border p-3', isMe && 'border-primary/40 bg-primary/5')}>
      <div className='mb-2 flex items-baseline justify-between gap-2'>
        <div className='min-w-0 truncate'>
          {isMe ? (
            <span className='text-primary font-semibold'>Minha produção</span>
          ) : (
            <>
              <span className='text-chart-2 font-semibold'>{person.name}</span>{' '}
              <span className='text-muted-foreground text-xs'>· {roleLabel(person.role)}</span>
            </>
          )}
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
  onDelete,
  onAddPayment,
  onEditPayment,
  onDeletePayment
}: {
  data: SewingMonth;
  onEdit: (e: SewingEntryRow) => void;
  onDelete: (e: SewingEntryRow) => void;
  onAddPayment: (s: PaymentSheetState) => void;
  onEditPayment: (p: MonthPayment) => void;
  onDeletePayment: (p: MonthPayment) => void;
}) {
  const [showEntries, setShowEntries] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const me = data.people.find((p) => p.workerId === null);
  // A equipe fica fora da conta do mês (a oficina paga eles); só aparece se pedir.
  const team = data.people.filter((p) => p.workerId !== null);
  const teamPieces = team.reduce((s, p) => s + p.pieces, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>{formatMonth(data.month)}</CardTitle>
        <CardDescription>
          {me ? (
            <>
              {formatNumber(me.pieces)} peças ·{' '}
              <span className='text-primary font-medium'>{formatMoney(me.value)}</span>
            </>
          ) : (
            'Sem produção lançada ainda'
          )}
        </CardDescription>
        <CardAction className='text-right'>
          <div className='text-muted-foreground text-xs'>Saldo</div>
          <div className={cn('font-semibold tabular-nums', moneyTone(data.balance))}>
            {formatMoney(data.balance)}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className='space-y-3'>
        {/* Ordem da conta: o que produzi → o que recebi → o saldo. */}
        <div className='grid items-start gap-3 md:grid-cols-2'>
          {me && <PersonBlock person={me} />}
          <MonthLedger
            data={data}
            onAddPayment={onAddPayment}
            onEditPayment={onEditPayment}
            onDeletePayment={onDeletePayment}
          />
        </div>
        {team.length > 0 && (
          <Button
            variant='ghost'
            size='sm'
            className='w-full'
            onClick={() => setShowTeam((v) => !v)}
            aria-expanded={showTeam}
          >
            {showTeam
              ? 'Ocultar produção da equipe'
              : `Ver produção da equipe (${formatNumber(teamPieces)} peças)`}
            <Icons.chevronDown className={cn('transition-transform', showTeam && 'rotate-180')} />
          </Button>
        )}
        {showTeam && (
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
            {team.map((p) => (
              <PersonBlock key={p.workerId} person={p} />
            ))}
          </div>
        )}
        {data.entries > 0 && (
          <Button
            variant='ghost'
            size='sm'
            className='w-full'
            onClick={() => setShowEntries((v) => !v)}
            aria-expanded={showEntries}
          >
            {showEntries ? 'Ocultar lançamentos' : `Ver / editar lançamentos (${data.entries})`}
            <Icons.chevronDown
              className={cn('transition-transform', showEntries && 'rotate-180')}
            />
          </Button>
        )}
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
  const [paymentSheet, setPaymentSheet] = useState<PaymentSheetState | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<{ id: number } | null>(null);

  const removeEntry = useApiMutation(deleteSewingEntry, {
    success: 'Lançamento excluído',
    onSuccess: () => setDeletingEntry(null)
  });
  const removePayment = useApiMutation(deleteSewingPayment, {
    success: 'Anotação excluída',
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
                onClick={() =>
                  setPaymentSheet({
                    month: currentMonth(),
                    kind: 'pagamento',
                    amount: summary?.balance
                  })
                }
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
                Último recebimento: {formatMoney(summary.lastPayment.amount)} em{' '}
                {formatDate(summary.lastPayment.date)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='producao' className='mt-6'>
        <TabsList>
          <TabsTrigger value='producao'>Produção por mês</TabsTrigger>
          <TabsTrigger value='pagamentos'>Recebimentos</TabsTrigger>
        </TabsList>

        <TabsContent value='producao' className='space-y-4'>
          {loadingMonths && <Skeleton className='h-60 w-full' />}
          {months && months.length === 0 && (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              Nenhuma produção lançada ainda.
            </p>
          )}
          {months?.map((m) => (
            <MonthBox
              key={m.month}
              data={m}
              onEdit={setEditingEntry}
              onDelete={setDeletingEntry}
              onAddPayment={setPaymentSheet}
              onEditPayment={(p) => setPaymentSheet({ payment: { ...p, month: m.month } })}
              onDeletePayment={setDeletingPayment}
            />
          ))}
        </TabsContent>

        <TabsContent value='pagamentos' className='space-y-2'>
          {(payments ?? []).length === 0 && (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              Nenhum pagamento, adiantamento ou vale anotado ainda.
            </p>
          )}
          {(payments ?? []).map((p) => (
            <Card key={p.id} className='flex-row items-center gap-3 px-4 py-3'>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <KindTag kind={p.kind} />
                  <span className='font-medium tabular-nums'>{formatMoney(p.amount)}</span>
                </div>
                <div className='text-muted-foreground mt-0.5 truncate text-xs'>
                  Ref. {formatMonth(p.month).toLowerCase()} · recebido em {formatDate(p.date)}
                  {p.notes && ` · ${p.notes}`}
                </div>
              </div>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={() => setPaymentSheet({ payment: p })}
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
      {paymentSheet && (
        <SewingPaymentSheet
          key={paymentSheet.payment?.id ?? `novo-${paymentSheet.month}`}
          payment={paymentSheet.payment}
          month={paymentSheet.month}
          kind={paymentSheet.kind}
          amount={paymentSheet.amount}
          open
          onOpenChange={(o) => !o && setPaymentSheet(null)}
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
        title='Excluir anotação?'
        description='A receita correspondente no financeiro também será removida.'
      />
    </PageContainer>
  );
}
