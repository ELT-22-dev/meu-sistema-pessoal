'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { parseAsString, useQueryState } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { api, qs } from '@/lib/api-client';
import {
  currentMonth,
  formatDate,
  formatMonth,
  formatMoney,
  monthRange,
  shiftMonth,
  todayISO,
  toDate
} from '@/lib/format';
import { cn } from '@/lib/utils';

type Kind = 'receita' | 'despesa' | 'prazo' | 'tarefa' | 'costura';
type AgendaEvent = {
  key: string;
  date: string;
  kind: Kind;
  title: string;
  subtitle: string | null;
  amount: number | null;
  done: boolean;
  href: string;
};

const KIND: Record<Kind, { label: string; dot: string; chip: string }> = {
  receita: {
    label: 'Receber / recebido',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
  },
  despesa: {
    label: 'Pagar / pago',
    dot: 'bg-red-500',
    chip: 'bg-red-500/15 text-red-700 dark:text-red-300'
  },
  prazo: {
    label: 'Prazo de projeto',
    dot: 'bg-indigo-500',
    chip: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
  },
  tarefa: {
    label: 'Tarefa',
    dot: 'bg-sky-500',
    chip: 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
  },
  costura: {
    label: 'Costura',
    dot: 'bg-amber-500',
    chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
  }
};

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/** Dias do mês com preenchimento para começar na segunda-feira. */
function monthCells(month: string) {
  const { from, to } = monthRange(month);
  const first = toDate(from);
  const lead = (first.getDay() + 6) % 7;
  const days = Number(to.slice(8, 10));
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${month}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

function statusLabel(e: AgendaEvent) {
  if (e.kind === 'receita') return e.done ? 'Recebido' : 'A receber';
  if (e.kind === 'despesa') return e.done ? 'Pago' : 'A pagar';
  if (e.kind === 'costura') return null;
  return e.done ? 'Concluído' : null;
}

function EventRow({ e }: { e: AgendaEvent }) {
  const status = statusLabel(e);
  return (
    <Link
      href={e.href}
      className='hover:bg-muted -mx-2 flex items-center gap-3 rounded-md px-2 py-2'
    >
      <span className={cn('size-2.5 shrink-0 rounded-full', KIND[e.kind].dot)} />
      <div className='min-w-0 flex-1'>
        <div
          className={cn(
            'truncate text-sm font-medium',
            e.done &&
              (e.kind === 'prazo' || e.kind === 'tarefa') &&
              'text-muted-foreground line-through'
          )}
        >
          {e.title}
        </div>
        <div className='text-muted-foreground truncate text-xs'>
          {[KIND[e.kind].label, e.subtitle, status].filter(Boolean).join(' · ')}
        </div>
      </div>
      {e.amount !== null && e.amount > 0 && (
        <span
          className={cn(
            'shrink-0 text-sm font-semibold tabular-nums',
            e.kind === 'despesa' ? 'text-destructive' : 'text-primary',
            !e.done && 'opacity-70'
          )}
        >
          {formatMoney(e.amount)}
        </span>
      )}
    </Link>
  );
}

export default function AgendaPage() {
  const [month, setMonth] = useQueryState('mes', parseAsString.withDefault(currentMonth()));
  const today = todayISO();
  const [selected, setSelected] = useState<string>(today);
  const { data, isLoading } = useQuery({
    queryKey: ['agenda', month],
    queryFn: () => api.get<{ month: string; events: AgendaEvent[] }>(`/agenda${qs({ month })}`),
    placeholderData: (prev) => prev
  });

  const byDate = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const e of data?.events ?? []) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [data]);

  const cells = monthCells(month);
  const selectedInMonth = selected.startsWith(month) ? selected : null;
  const dayEvents = selectedInMonth ? (byDate.get(selectedInMonth) ?? []) : [];

  const goMonth = (m: string) => {
    void setMonth(m === currentMonth() ? null : m);
    setSelected(m === currentMonth() ? today : `${m}-01`);
  };

  const income = (data?.events ?? []).filter((e) => e.kind === 'receita');
  const toReceive = income.filter((e) => !e.done).reduce((s, e) => s + (e.amount ?? 0), 0);
  const received = income.filter((e) => e.done).reduce((s, e) => s + (e.amount ?? 0), 0);

  return (
    <PageContainer
      pageTitle='Agenda'
      pageDescription='Cobranças, pagamentos, prazos, tarefas e produção do mês.'
    >
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => goMonth(shiftMonth(month, -1))}
            aria-label='Mês anterior'
          >
            <Icons.chevronLeft />
          </Button>
          <div className='min-w-40 text-center font-semibold'>{formatMonth(month)}</div>
          <Button
            variant='outline'
            size='icon'
            onClick={() => goMonth(shiftMonth(month, 1))}
            aria-label='Próximo mês'
          >
            <Icons.chevronRight />
          </Button>
          {month !== currentMonth() && (
            <Button variant='ghost' size='sm' onClick={() => goMonth(currentMonth())}>
              Hoje
            </Button>
          )}
        </div>
        <div className='text-muted-foreground text-sm'>
          Recebido <span className='text-primary font-semibold'>{formatMoney(received)}</span> · a
          receber <span className='text-foreground font-semibold'>{formatMoney(toReceive)}</span>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='gap-0 py-0 lg:col-span-2'>
          <div className='text-muted-foreground grid grid-cols-7 border-b text-center text-xs font-medium'>
            {WEEKDAYS.map((d) => (
              <div key={d} className='py-2'>
                {d}
              </div>
            ))}
          </div>
          {isLoading && !data ? (
            <Skeleton className='m-3 h-80' />
          ) : (
            <div className='grid grid-cols-7'>
              {cells.map((date, i) => {
                if (!date)
                  return (
                    <div key={i} className='bg-muted/20 min-h-14 border-r border-b md:min-h-24' />
                  );
                const events = byDate.get(date) ?? [];
                const isToday = date === today;
                const isSelected = date === selectedInMonth;
                return (
                  <button
                    key={date}
                    type='button'
                    onClick={() => setSelected(date)}
                    aria-label={`${formatDate(date, { day: 'numeric', month: 'long' })}: ${events.length} evento(s)`}
                    aria-pressed={isSelected}
                    className={cn(
                      'hover:bg-muted/50 flex min-h-14 min-w-0 flex-col items-stretch gap-1 border-r border-b p-1 text-left transition-colors md:min-h-24 md:p-1.5',
                      isSelected && 'bg-primary/10 hover:bg-primary/15'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 items-center justify-center self-center rounded-full text-xs md:self-start',
                        isToday && 'bg-primary text-primary-foreground font-semibold'
                      )}
                    >
                      {Number(date.slice(8))}
                    </span>
                    {/* Celular: bolinhas */}
                    <span className='flex flex-wrap justify-center gap-0.5 md:hidden'>
                      {[...new Set(events.map((e) => e.kind))].map((k) => (
                        <span key={k} className={cn('size-1.5 rounded-full', KIND[k].dot)} />
                      ))}
                    </span>
                    {/* Tablet/desktop: etiquetas */}
                    <span className='hidden min-w-0 flex-col gap-0.5 md:flex'>
                      {events.slice(0, 3).map((e) => (
                        <span
                          key={e.key}
                          className={cn(
                            'truncate rounded px-1 py-0.5 text-[11px] leading-tight',
                            KIND[e.kind].chip,
                            e.done && e.kind !== 'costura' && 'opacity-60'
                          )}
                        >
                          {e.amount && e.kind !== 'costura' ? `${formatMoney(e.amount)} ` : ''}
                          {e.title}
                        </span>
                      ))}
                      {events.length > 3 && (
                        <span className='text-muted-foreground px-1 text-[11px]'>
                          +{events.length - 3} mais
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card className='lg:sticky lg:top-20 lg:self-start'>
          <CardHeader>
            <CardTitle className='capitalize'>
              {selectedInMonth
                ? formatDate(selectedInMonth, { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Escolha um dia'}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-1'>
            {selectedInMonth && dayEvents.length === 0 && (
              <p className='text-muted-foreground text-sm'>Nada neste dia.</p>
            )}
            {dayEvents.map((e) => (
              <EventRow key={e.key} e={e} />
            ))}
            <div className='text-muted-foreground mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t pt-3 text-xs'>
              {(Object.keys(KIND) as Kind[]).map((k) => (
                <span key={k} className='inline-flex items-center gap-1.5'>
                  <span className={cn('size-2 rounded-full', KIND[k].dot)} />
                  {KIND[k].label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
