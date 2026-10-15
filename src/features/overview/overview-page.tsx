'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from 'recharts';
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { StatCard } from '@/components/app/stat-card';
import { DueLabel } from '@/components/app/due-label';
import { ProjectStatusBadge } from '@/components/app/status-badge';
import { TX_AREAS, labelOf } from '@/config/options';
import { api, qs } from '@/lib/api-client';
import { formatDate, formatMonth, formatMoney, formatNumber, todayISO } from '@/lib/format';
import { cn } from '@/lib/utils';
import { TransactionFormSheet } from '@/features/finance/transaction-form';

type Overview = {
  month: string;
  income: number;
  expense: number;
  balance: number;
  toPay: number;
  prevIncome: number;
  receivable: { projects: number; sewing: number; salon: number; other: number };
  salon: { monthCuts: number; monthValue: number };
  activeProjects: number;
  openQuotes: number;
  sewing: { monthPieces: number; monthValue: number; todayPieces: number };
  monthly: { month: string; income: number; expense: number }[];
  byArea: { area: string; value: number }[];
  deadlines: {
    id: number;
    title: string;
    dueDate: string;
    status: string;
    clientName: string | null;
  }[];
  tasksDue: {
    id: number;
    title: string;
    dueDate: string;
    projectId: number;
    projectTitle: string;
  }[];
  recent: {
    id: number;
    type: string;
    area: string;
    description: string;
    amount: number;
    date: string;
    status: string;
  }[];
};

const monthlyConfig = {
  income: { label: 'Receitas', color: 'var(--chart-1)' },
  expense: { label: 'Despesas', color: 'var(--chart-4)' }
} satisfies ChartConfig;

const AREA_COLORS: Record<string, string> = {
  dev: 'var(--chart-2)',
  costura: 'var(--chart-3)',
  cabeleireiro: 'var(--chart-4)',
  pessoal: 'var(--chart-5)'
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function OverviewPage({ name }: { name: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['overview', todayISO()],
    queryFn: () => api.get<Overview>(`/painel${qs({ today: todayISO() })}`)
  });
  const [txOpen, setTxOpen] = useState(false);
  const [txType, setTxType] = useState<'receita' | 'despesa'>('despesa');

  const receivableTotal = data
    ? data.receivable.projects +
      data.receivable.sewing +
      data.receivable.salon +
      data.receivable.other
    : 0;
  const incomeDelta =
    data && data.prevIncome > 0 ? ((data.income - data.prevIncome) / data.prevIncome) * 100 : null;

  const areaConfig = Object.fromEntries(
    TX_AREAS.map((a) => [a.value, { label: a.label, color: AREA_COLORS[a.value] }])
  ) satisfies ChartConfig;

  return (
    <PageContainer>
      <div className='space-y-4'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              {greeting()}, {name.split(' ')[0]}
            </h1>
            <p className='text-muted-foreground text-sm'>
              {data ? formatMonth(data.month) : ' '} · resumo de tudo em um lugar
            </p>
          </div>
          <div className='grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto'>
            <Button variant='outline' render={<Link href='/dashboard/costura' />}>
              <Icons.sewing /> Produção
            </Button>
            <Button
              variant='outline'
              onClick={() => {
                setTxType('despesa');
                setTxOpen(true);
              }}
            >
              <Icons.expense className='text-destructive' /> Despesa
            </Button>
            <Button
              onClick={() => {
                setTxType('receita');
                setTxOpen(true);
              }}
            >
              <Icons.income /> Receita
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <StatCard
            label='Recebido no mês'
            value={formatMoney(data?.income)}
            tone='positive'
            loading={isLoading}
            icon={<Icons.income />}
            hint={
              incomeDelta !== null
                ? `${incomeDelta >= 0 ? '+' : ''}${incomeDelta.toFixed(0)}% vs mês passado`
                : 'Receitas pagas'
            }
          />
          <StatCard
            label='Gasto no mês'
            value={formatMoney(data?.expense)}
            tone='negative'
            loading={isLoading}
            icon={<Icons.expense />}
            hint={
              data && data.toPay > 0 ? `${formatMoney(data.toPay)} ainda a pagar` : 'Despesas pagas'
            }
          />
          <StatCard
            label='A receber'
            value={formatMoney(receivableTotal)}
            tone='accent'
            loading={isLoading}
            icon={<Icons.cash />}
            hint={
              data
                ? `Projetos ${formatMoney(data.receivable.projects)} · Oficina ${formatMoney(data.receivable.sewing)} · Salão ${formatMoney(data.receivable.salon)}`
                : undefined
            }
          />
          <StatCard
            label='Costura no mês'
            value={`${formatNumber(data?.sewing.monthPieces)} pç`}
            loading={isLoading}
            icon={<Icons.sewing />}
            hint={
              data
                ? `${formatMoney(data.sewing.monthValue)} · hoje ${formatNumber(data.sewing.todayPieces)} pç`
                : undefined
            }
          />
        </div>

        <div className='grid gap-4 lg:grid-cols-7'>
          <Card className='lg:col-span-4'>
            <CardHeader>
              <CardTitle>Receitas x despesas</CardTitle>
              <CardDescription>Últimos 6 meses (valores pagos)</CardDescription>
              <CardAction>
                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    (data?.balance ?? 0) < 0 ? 'text-destructive' : 'text-primary'
                  )}
                >
                  {data && `Saldo do mês ${formatMoney(data.balance)}`}
                </span>
              </CardAction>
            </CardHeader>
            <CardContent>
              {data ? (
                <ChartContainer config={monthlyConfig} className='aspect-auto h-64 w-full'>
                  <BarChart data={data.monthly}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey='month'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(m) => formatMonth(m, 'short')}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(m) => formatMonth(String(m))}
                          formatter={(value, name) => (
                            <div className='flex w-full justify-between gap-4'>
                              <span className='text-muted-foreground'>
                                {monthlyConfig[name as keyof typeof monthlyConfig]?.label}
                              </span>
                              <span className='font-mono font-medium tabular-nums'>
                                {formatMoney(Number(value))}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey='income' fill='var(--color-income)' radius={4} />
                    <Bar dataKey='expense' fill='var(--color-expense)' radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <Skeleton className='h-64 w-full' />
              )}
            </CardContent>
          </Card>

          <Card className='lg:col-span-3'>
            <CardHeader>
              <CardTitle>De onde vem o dinheiro</CardTitle>
              <CardDescription>Receitas por área · 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {!data ? (
                <Skeleton className='h-64 w-full' />
              ) : data.byArea.length === 0 ? (
                <p className='text-muted-foreground py-16 text-center text-sm'>
                  Sem receitas registradas ainda.
                </p>
              ) : (
                <div className='flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row'>
                  <ChartContainer config={areaConfig} className='aspect-square h-48'>
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value, name) => (
                              <span>
                                {labelOf(TX_AREAS, String(name))}: {formatMoney(Number(value))}
                              </span>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={data.byArea}
                        dataKey='value'
                        nameKey='area'
                        innerRadius={50}
                        strokeWidth={4}
                      >
                        {data.byArea.map((a) => (
                          <Cell key={a.area} fill={AREA_COLORS[a.area] ?? 'var(--chart-5)'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <ul className='w-full space-y-2 text-sm'>
                    {data.byArea.map((a) => (
                      <li key={a.area} className='flex items-center justify-between gap-2'>
                        <span className='flex items-center gap-2'>
                          <span
                            className='size-2.5 rounded-full'
                            style={{ background: AREA_COLORS[a.area] }}
                          />
                          {labelOf(TX_AREAS, a.area)}
                        </span>
                        <span className='tabular-nums'>{formatMoney(a.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Prazos próximos</CardTitle>
              <CardDescription>
                {data
                  ? `${data.activeProjects} projeto(s) ativo(s) · ${data.openQuotes} orçamento(s) em aberto`
                  : ' '}
              </CardDescription>
              <CardAction>
                <Button
                  variant='ghost'
                  size='sm'
                  render={<Link href='/dashboard/projetos?status=ativos' />}
                >
                  Ver todos
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className='space-y-1'>
              {!data && <Skeleton className='h-32 w-full' />}
              {data && data.deadlines.length === 0 && data.tasksDue.length === 0 && (
                <p className='text-muted-foreground text-sm'>
                  Nada vencendo nos próximos 14 dias. 🎉
                </p>
              )}
              {data?.deadlines.map((d) => (
                <Link
                  key={`p${d.id}`}
                  href={`/dashboard/projetos/${d.id}`}
                  className='hover:bg-muted -mx-2 flex items-center justify-between gap-2 rounded-md px-2 py-2'
                >
                  <div className='min-w-0'>
                    <div className='truncate text-sm font-medium'>{d.title}</div>
                    <div className='text-muted-foreground truncate text-xs'>
                      {d.clientName ?? 'Sem cliente'}
                    </div>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <ProjectStatusBadge status={d.status} />
                    <DueLabel date={d.dueDate} />
                  </div>
                </Link>
              ))}
              {data?.tasksDue.map((t) => (
                <Link
                  key={`t${t.id}`}
                  href={`/dashboard/projetos/${t.projectId}`}
                  className='hover:bg-muted -mx-2 flex items-center justify-between gap-2 rounded-md px-2 py-2'
                >
                  <div className='flex min-w-0 items-center gap-2'>
                    <Icons.tasks className='text-muted-foreground size-4 shrink-0' />
                    <div className='min-w-0'>
                      <div className='truncate text-sm'>{t.title}</div>
                      <div className='text-muted-foreground truncate text-xs'>{t.projectTitle}</div>
                    </div>
                  </div>
                  <DueLabel date={t.dueDate} />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimos lançamentos</CardTitle>
              <CardAction>
                <Button variant='ghost' size='sm' render={<Link href='/dashboard/financeiro' />}>
                  Financeiro
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className='space-y-1'>
              {!data && <Skeleton className='h-32 w-full' />}
              {data && data.recent.length === 0 && (
                <p className='text-muted-foreground text-sm'>Nenhum lançamento ainda.</p>
              )}
              {data?.recent.map((t) => (
                <div key={t.id} className='flex items-center justify-between gap-2 py-1.5'>
                  <div className='min-w-0'>
                    <div className='truncate text-sm'>{t.description}</div>
                    <div className='text-muted-foreground text-xs'>
                      {formatDate(t.date)} · {labelOf(TX_AREAS, t.area)}
                      {t.status === 'pendente' && ' · pendente'}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-sm font-semibold tabular-nums',
                      t.type === 'receita' ? 'text-primary' : 'text-destructive'
                    )}
                  >
                    {t.type === 'receita' ? '+' : '−'} {formatMoney(t.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <TransactionFormSheet
        key={txType}
        defaultType={txType}
        open={txOpen}
        onOpenChange={setTxOpen}
      />
    </PageContainer>
  );
}
