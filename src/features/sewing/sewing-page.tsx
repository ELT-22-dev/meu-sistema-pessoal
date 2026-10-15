'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { StatCard } from '@/components/app/stat-card';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { addDaysISO, formatDate, formatMoney, formatNumber, todayISO } from '@/lib/format';
import type { SewingPayment } from '@/db/schema';
import {
  deleteSewingEntry,
  deleteSewingPayment,
  lastPricesQuery,
  sewingEntriesQuery,
  sewingModelsQuery,
  sewingPaymentsQuery,
  sewingSummaryQuery,
  sewingWorkersQuery,
  type SewingEntryRow,
  type SewingSummary
} from './api';
import { QuickEntry } from './quick-entry';
import { SewingEntrySheet, SewingPaymentSheet } from './sewing-forms';
import { SEWING_ROLES } from './schema';

const chartConfig = {
  pieces: { label: 'Eu', color: 'var(--chart-1)' },
  teamPieces: { label: 'Equipe', color: 'var(--chart-2)' }
} satisfies ChartConfig;

function ProductionChart({ summary }: { summary: SewingSummary }) {
  // Últimos 30 dias, inclusive os sem produção.
  const data = useMemo(() => {
    const map = new Map(summary.series.map((s) => [s.date, s]));
    const today = todayISO();
    return Array.from({ length: 30 }, (_, i) => {
      const date = addDaysISO(today, i - 29);
      const s = map.get(date);
      return { date, pieces: s?.pieces ?? 0, teamPieces: s?.teamPieces ?? 0, value: s?.value ?? 0 };
    });
  }, [summary.series]);

  return (
    <ChartContainer config={chartConfig} className='aspect-auto h-48 w-full'>
      <BarChart data={data} margin={{ left: 0, right: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='date'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(d) => formatDate(d, { day: '2-digit', month: '2-digit' })}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { date: string; value: number } | undefined;
                return p
                  ? `${formatDate(p.date, { weekday: 'short', day: '2-digit', month: '2-digit' })} · ${formatMoney(p.value)}`
                  : '';
              }}
            />
          }
        />
        <Bar dataKey='pieces' stackId='a' fill='var(--color-pieces)' />
        <Bar
          dataKey='teamPieces'
          stackId='a'
          fill='var(--color-teamPieces)'
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}

type DayGroup = {
  date: string;
  mine: number;
  mineValue: number;
  team: number;
  items: SewingEntryRow[];
};

function groupByDate(entries: SewingEntryRow[]) {
  const groups: DayGroup[] = [];
  for (const e of entries) {
    let g = groups.find((x) => x.date === e.date);
    if (!g) {
      g = { date: e.date, mine: 0, mineValue: 0, team: 0, items: [] };
      groups.push(g);
    }
    g.items.push(e);
    if (e.workerId) g.team += e.quantity;
    else {
      g.mine += e.quantity;
      g.mineValue += e.total;
    }
  }
  return groups;
}

export default function SewingPage() {
  const { data: models = [], isLoading: loadingModels } = useQuery(sewingModelsQuery());
  const { data: summary, isLoading: loadingSummary } = useQuery(sewingSummaryQuery());
  const [range, setRange] = useState(30);
  const { data: entries } = useQuery(
    sewingEntriesQuery({ from: addDaysISO(todayISO(), -range), to: todayISO() })
  );
  const { data: payments } = useQuery(sewingPaymentsQuery());
  const { data: workers = [], isLoading: loadingWorkers } = useQuery(sewingWorkersQuery());
  const { data: prices } = useQuery(lastPricesQuery());
  const teamActive = workers.filter((w) => w.active || w.monthPieces > 0);
  const teamMonth = teamActive.reduce((s, w) => s + w.monthPieces, 0);

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

  const groups = useMemo(() => groupByDate(entries ?? []), [entries]);
  const avgPerDay =
    summary && summary.month.days > 0 ? summary.month.pieces / summary.month.days : 0;

  return (
    <PageContainer
      pageTitle='Costura'
      pageDescription='Sua produção e a da equipe na oficina, e quanto você tem a receber.'
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
        <div className='space-y-4 lg:col-span-2'>
          {loadingModels || loadingWorkers ? (
            <Skeleton className='h-80 w-full' />
          ) : (
            <QuickEntry models={models} workers={workers} prices={prices} />
          )}

          <Card className='bg-primary/5 border-primary/30'>
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

        <div className='space-y-4 lg:col-span-3'>
          <h2 className='text-muted-foreground text-sm font-medium'>Minha produção</h2>
          <div className='-mt-2 grid grid-cols-2 gap-3'>
            <StatCard
              label='Hoje'
              value={`${formatNumber(summary?.today.pieces)} pç`}
              hint={formatMoney(summary?.today.value)}
              loading={loadingSummary}
            />
            <StatCard
              label='Semana'
              value={`${formatNumber(summary?.week.pieces)} pç`}
              hint={formatMoney(summary?.week.value)}
              loading={loadingSummary}
            />
            <StatCard
              label='Mês'
              value={`${formatNumber(summary?.month.pieces)} pç`}
              hint={formatMoney(summary?.month.value)}
              tone='positive'
              loading={loadingSummary}
            />
            <StatCard
              label='Média/dia (mês)'
              value={`${formatNumber(Math.round(avgPerDay))} pç`}
              hint={`${summary?.month.days ?? 0} dia(s) trabalhado(s)`}
              loading={loadingSummary}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipe este mês</CardTitle>
              <CardDescription>
                {formatNumber(teamMonth)} peças · a oficina paga direto a cada um
              </CardDescription>
              <CardAction>
                <Button
                  variant='ghost'
                  size='sm'
                  render={<Link href='/dashboard/costura/equipe' />}
                >
                  {teamActive.length ? 'Ver equipe' : 'Adicionar'}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className='space-y-2'>
              {teamActive.length === 0 && (
                <p className='text-muted-foreground text-sm'>
                  Cadastre os retistas para lançar a produção de cada um.
                </p>
              )}
              {teamActive.map((w) => (
                <div key={w.id} className='flex items-center justify-between gap-2 text-sm'>
                  <span className='min-w-0 truncate'>
                    {w.name}{' '}
                    <span className='text-muted-foreground text-xs'>
                      · {SEWING_ROLES.find((r) => r.value === w.role)?.label ?? w.role}
                    </span>
                  </span>
                  <span className='text-muted-foreground shrink-0 tabular-nums'>
                    hoje {formatNumber(w.todayPieces)} · mês{' '}
                    <span className='text-foreground font-medium'>
                      {formatNumber(w.monthPieces)} pç
                    </span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peças por dia</CardTitle>
              <CardDescription>Últimos 30 dias — você e a equipe</CardDescription>
            </CardHeader>
            <CardContent>
              {summary ? (
                <ProductionChart summary={summary} />
              ) : (
                <Skeleton className='h-48 w-full' />
              )}
            </CardContent>
          </Card>

          {summary && summary.byModel.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Minhas peças no mês por modelo</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                {summary.byModel.map((m) => (
                  <div key={m.id} className='flex items-center justify-between gap-2 text-sm'>
                    <span className='truncate'>{m.name}</span>
                    <span className='text-muted-foreground shrink-0 tabular-nums'>
                      {formatNumber(m.pieces)} pç ·{' '}
                      <span className='text-foreground'>{formatMoney(m.value)}</span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Tabs defaultValue='producao' className='mt-6'>
        <TabsList>
          <TabsTrigger value='producao'>Produção</TabsTrigger>
          <TabsTrigger value='pagamentos'>Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value='producao' className='space-y-3'>
          {groups.length === 0 && (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              Nenhuma produção nos últimos {range} dias.
            </p>
          )}
          {groups.map((g) => (
            <Card key={g.date} className='gap-2 py-3'>
              <div className='flex items-center justify-between px-4'>
                <div className='text-sm font-semibold capitalize'>
                  {formatDate(g.date, { weekday: 'long', day: '2-digit', month: '2-digit' })}
                </div>
                <div className='text-muted-foreground text-right text-xs tabular-nums sm:text-sm'>
                  {g.mine > 0 && (
                    <div>
                      Eu {formatNumber(g.mine)} pç ·{' '}
                      <span className='text-foreground font-medium'>
                        {formatMoney(g.mineValue)}
                      </span>
                    </div>
                  )}
                  {g.team > 0 && <div>Equipe {formatNumber(g.team)} pç</div>}
                </div>
              </div>
              <ul className='divide-y px-4'>
                {g.items.map((e) => (
                  <li key={e.id} className='flex items-center gap-2 py-1.5 text-sm'>
                    <span className='min-w-0 flex-1 truncate'>
                      <span
                        className={
                          e.workerId ? 'text-chart-2 font-medium' : 'text-primary font-medium'
                        }
                      >
                        {e.workerName ?? 'Eu'}
                      </span>{' '}
                      · {e.modelName}
                      {e.notes && <span className='text-muted-foreground'> — {e.notes}</span>}
                    </span>
                    <span className='tabular-nums'>
                      {e.quantity} × {formatMoney(e.unitPrice)}
                    </span>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      onClick={() => setEditingEntry(e)}
                      aria-label='Editar'
                    >
                      <Icons.edit />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      onClick={() => setDeletingEntry(e)}
                      aria-label='Excluir'
                    >
                      <Icons.trash />
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          {range < 365 && (entries?.length ?? 0) > 0 && (
            <Button
              variant='ghost'
              className='w-full'
              onClick={() => setRange((r) => (r === 30 ? 90 : 365))}
            >
              Ver mais antigos
            </Button>
          )}
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
          models={models}
          workers={workers}
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
