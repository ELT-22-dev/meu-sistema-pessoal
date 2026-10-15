'use client';

import { useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { StatCard } from '@/components/app/stat-card';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate, formatMoney, formatNumber, todayISO } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { HaircutPayment } from '@/db/schema';
import {
  deleteHaircutEntry,
  deleteHaircutPayment,
  haircutEntriesQuery,
  haircutPaymentsQuery,
  haircutServicesQuery,
  haircutSummaryQuery,
  lastSaturday,
  saveHaircutEntry,
  type HaircutEntryRow,
  type HaircutServiceRow
} from './api';
import { HaircutEntrySheet, HaircutPaymentSheet } from './haircut-forms';

function QuickCuts({ services }: { services: HaircutServiceRow[] }) {
  const active = services.filter((s) => s.active);
  const [picked, setPicked] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [date, setDate] = useState(lastSaturday());
  const service = active.find((s) => s.id === picked) ?? active[0];
  const share = service ? (service.price * service.commissionPct) / 100 : 0;

  const mutation = useApiMutation(saveHaircutEntry, {
    success: `${quantity} corte(s) de ${service?.name ?? ''} lançado(s)`,
    onSuccess: () => setQuantity(0)
  });

  if (active.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-start gap-3'>
          <p className='text-sm'>Cadastre os tipos de corte (preço e a sua %) para começar.</p>
          <Button render={<Link href='/dashboard/cabeleireiro/tipos' />}>
            <Icons.add /> Tipos de corte
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-primary/30'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.scissors className='text-primary size-5' /> Lançar cortes
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label>Tipo de corte</Label>
          <div className='flex flex-wrap gap-2'>
            {active.map((s) => (
              <button
                key={s.id}
                type='button'
                onClick={() => setPicked(s.id)}
                aria-pressed={s.id === service?.id}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  s.id === service?.id
                    ? 'border-primary bg-primary/15 text-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <div className='font-medium'>{s.name}</div>
                <div className='text-xs tabular-nums'>
                  você: {formatMoney((s.price * s.commissionPct) / 100)} (
                  {formatNumber(s.commissionPct)}%)
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='cuts-qty'>Quantidade</Label>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='icon-lg'
              className='size-12 shrink-0'
              onClick={() => setQuantity((q) => Math.max(0, q - 1))}
              aria-label='Menos um'
            >
              <Icons.minus />
            </Button>
            <Input
              id='cuts-qty'
              type='number'
              inputMode='numeric'
              min={0}
              value={quantity || ''}
              placeholder='0'
              onChange={(e) => setQuantity(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
              className='h-12 text-center text-2xl font-semibold tabular-nums'
            />
            <Button
              type='button'
              variant='outline'
              size='icon-lg'
              className='size-12 shrink-0'
              onClick={() => setQuantity((q) => q + 1)}
              aria-label='Mais um'
            >
              <Icons.add />
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='cuts-date'>Dia</Label>
          <Input
            id='cuts-date'
            type='date'
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value || lastSaturday())}
          />
        </div>

        <LoadingButton
          size='lg'
          className='h-12 w-full text-base'
          disabled={!service || quantity <= 0}
          loading={mutation.isPending}
          onClick={() =>
            service &&
            mutation.mutate({ values: { date, serviceId: service.id, quantity, notes: '' } })
          }
        >
          Salvar{quantity > 0 && ` · você ganha ${formatMoney(quantity * share)}`}
        </LoadingButton>
      </CardContent>
    </Card>
  );
}

type DayGroup = {
  date: string;
  cuts: number;
  gross: number;
  mine: number;
  items: HaircutEntryRow[];
};

function groupByDate(entries: HaircutEntryRow[]) {
  const groups: DayGroup[] = [];
  for (const e of entries) {
    let g = groups.find((x) => x.date === e.date);
    if (!g) {
      g = { date: e.date, cuts: 0, gross: 0, mine: 0, items: [] };
      groups.push(g);
    }
    g.items.push(e);
    g.cuts += e.quantity;
    g.gross += e.total;
    g.mine += e.mine;
  }
  return groups;
}

export default function HaircutPage() {
  const { data: services = [], isLoading: loadingServices } = useQuery(haircutServicesQuery());
  const { data: summary, isLoading } = useQuery(haircutSummaryQuery());
  const { data: entries } = useQuery(haircutEntriesQuery());
  const { data: payments } = useQuery(haircutPaymentsQuery());

  const [editingEntry, setEditingEntry] = useState<HaircutEntryRow | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<HaircutEntryRow | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<HaircutPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<HaircutPayment | null>(null);
  const removeEntry = useApiMutation(deleteHaircutEntry, {
    success: 'Lançamento excluído',
    onSuccess: () => setDeletingEntry(null)
  });
  const removePayment = useApiMutation(deleteHaircutPayment, {
    success: 'Pagamento excluído',
    onSuccess: () => setDeletingPayment(null)
  });

  const groups = useMemo(() => groupByDate(entries ?? []), [entries]);

  return (
    <PageContainer
      pageTitle='Cabeleireiro'
      pageDescription='Cortes de sábado: você fica com a sua % de cada corte; o salão paga por mês.'
      pageHeaderAction={
        <Button
          variant='outline'
          aria-label='Tipos de corte'
          render={<Link href='/dashboard/cabeleireiro/tipos' />}
        >
          <Icons.tag /> <span className='hidden sm:inline'>Tipos de corte</span>
        </Button>
      }
    >
      <div className='grid gap-4 lg:grid-cols-5'>
        <div className='space-y-4 lg:col-span-2'>
          {loadingServices ? (
            <Skeleton className='h-72 w-full' />
          ) : (
            <QuickCuts services={services} />
          )}
        </div>

        <div className='space-y-4 lg:col-span-3'>
          <Card className='bg-primary/5 border-primary/30'>
            <CardHeader>
              <CardDescription>A receber do salão</CardDescription>
              <CardTitle className='text-primary text-3xl tabular-nums'>
                {isLoading ? <Skeleton className='h-9 w-36' /> : formatMoney(summary?.balance)}
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
                Minha parte no total: {formatMoney(summary?.earned)} · já recebido:{' '}
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

          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            <StatCard
              label='Cortes no mês'
              value={formatNumber(summary?.month.cuts)}
              hint={`${summary?.month.days ?? 0} dia(s) trabalhado(s)`}
              loading={isLoading}
            />
            <StatCard
              label='Minha parte no mês'
              value={formatMoney(summary?.month.mine)}
              tone='positive'
              loading={isLoading}
            />
            <StatCard
              label='Total cobrado (mês)'
              value={formatMoney(summary?.month.gross)}
              hint='Valor dos cortes'
              loading={isLoading}
              className='col-span-2 sm:col-span-1'
            />
          </div>

          {summary && summary.byService.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No mês por tipo</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                {summary.byService.map((s) => (
                  <div key={s.id} className='flex items-center justify-between gap-2 text-sm'>
                    <span className='truncate'>{s.name}</span>
                    <span className='text-muted-foreground shrink-0 tabular-nums'>
                      {formatNumber(s.cuts)} cortes ·{' '}
                      <span className='text-foreground'>{formatMoney(s.mine)}</span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Tabs defaultValue='cortes' className='mt-6'>
        <TabsList>
          <TabsTrigger value='cortes'>Cortes</TabsTrigger>
          <TabsTrigger value='pagamentos'>Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value='cortes' className='space-y-3'>
          {groups.length === 0 && (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              Nenhum corte nos últimos 90 dias.
            </p>
          )}
          {groups.map((g) => (
            <Card key={g.date} className='gap-2 py-3'>
              <div className='flex items-center justify-between gap-2 px-4'>
                <div className='text-sm font-semibold capitalize'>
                  {formatDate(g.date, { weekday: 'long', day: '2-digit', month: '2-digit' })}
                </div>
                <div className='text-muted-foreground text-right text-xs tabular-nums sm:text-sm'>
                  {formatNumber(g.cuts)} cortes · {formatMoney(g.gross)} ·{' '}
                  <span className='text-primary font-medium'>você {formatMoney(g.mine)}</span>
                </div>
              </div>
              <ul className='divide-y px-4'>
                {g.items.map((e) => (
                  <li key={e.id} className='flex items-center gap-2 py-1.5 text-sm'>
                    <span className='min-w-0 flex-1 truncate'>
                      {e.serviceName}
                      {e.notes && <span className='text-muted-foreground'> — {e.notes}</span>}
                    </span>
                    <span className='text-right tabular-nums'>
                      {e.quantity} × {formatMoney(e.unitPrice)}
                      <span className='text-muted-foreground block text-xs'>
                        {formatNumber(e.commissionPct)}% = {formatMoney(e.mine)}
                      </span>
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
        </TabsContent>

        <TabsContent value='pagamentos' className='space-y-2'>
          {(payments ?? []).length === 0 && (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              Nenhum pagamento do salão registrado ainda.
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
        <HaircutEntrySheet
          key={editingEntry.id}
          entry={editingEntry}
          services={services}
          open
          onOpenChange={(o) => !o && setEditingEntry(null)}
        />
      )}
      {paymentOpen && (
        <HaircutPaymentSheet
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
            ? `${deletingEntry.quantity} × ${deletingEntry.serviceName} em ${formatDate(deletingEntry.date)}`
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
