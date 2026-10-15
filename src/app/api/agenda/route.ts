import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { handler, param } from '@/lib/api-handler';
import { currentMonth, monthRange } from '@/lib/format';
import { syncRecurring } from '@/server/recurring';

type AgendaEvent = {
  key: string;
  date: string;
  kind: 'receita' | 'despesa' | 'prazo' | 'tarefa' | 'costura' | 'salao';
  title: string;
  subtitle: string | null;
  amount: number | null;
  done: boolean;
  href: string;
};

const num = (v: unknown) => Number(v ?? 0);
const str = (v: unknown) => (v == null ? null : String(v));

/** Eventos do mês: cobranças/pagamentos, prazos de projetos, tarefas e produção da costura. */
export const GET = handler(async (req) => {
  const month = /^\d{4}-\d{2}$/.test(param(req, 'month') ?? '')
    ? param(req, 'month')!
    : currentMonth();
  const { from, to } = monthRange(month);
  await syncRecurring(month);

  const [txs, deadlines, tasks, sewing, salon] = await Promise.all([
    db.execute(sql`
      select t.id, t.date::text as date, t.type, t.description, t.amount, t.status,
             c.name as client_name
      from transactions t left join clients c on c.id = t.client_id
      where t.date between ${from} and ${to}
      order by t.date, t.id`),
    db.execute(sql`
      select p.id, p.title, p.due_date::text as date, p.status, c.name as client_name
      from projects p left join clients c on c.id = p.client_id
      where p.due_date between ${from} and ${to} and p.status <> 'cancelado'
      order by p.due_date`),
    db.execute(sql`
      select k.id, k.title, k.due_date::text as date, k.done, p.id as project_id, p.title as project_title
      from tasks k join projects p on p.id = k.project_id
      where k.due_date between ${from} and ${to}
      order by k.due_date`),
    db.execute(sql`
      select date::text as date,
             coalesce(sum(quantity) filter (where worker_id is null), 0) as mine,
             coalesce(sum(quantity) filter (where worker_id is not null), 0) as team,
             coalesce(sum(quantity * unit_price) filter (where worker_id is null), 0) as value
      from sewing_entries where date between ${from} and ${to}
      group by date order by date`),
    db.execute(sql`
      select date::text as date, sum(quantity) as cuts,
             sum(round(quantity * unit_price * commission_pct / 100, 2)) as mine
      from haircut_entries where date between ${from} and ${to}
      group by date order by date`)
  ]);

  const events: AgendaEvent[] = [
    ...txs.map((t) => ({
      key: `t${t.id}`,
      date: String(t.date),
      kind: String(t.type) as 'receita' | 'despesa',
      title: String(t.description),
      subtitle: str(t.client_name),
      amount: num(t.amount),
      done: t.status === 'pago',
      href: `/dashboard/financeiro?mes=${month}`
    })),
    ...deadlines.map((p) => ({
      key: `p${p.id}`,
      date: String(p.date),
      kind: 'prazo' as const,
      title: String(p.title),
      subtitle: str(p.client_name),
      amount: null,
      done: p.status === 'concluido',
      href: `/dashboard/projetos/${p.id}`
    })),
    ...tasks.map((k) => ({
      key: `k${k.id}`,
      date: String(k.date),
      kind: 'tarefa' as const,
      title: String(k.title),
      subtitle: str(k.project_title),
      amount: null,
      done: Boolean(k.done),
      href: `/dashboard/projetos/${k.project_id}`
    })),
    ...sewing.map((s) => ({
      key: `s${s.date}`,
      date: String(s.date),
      kind: 'costura' as const,
      title:
        num(s.mine) > 0
          ? `Costura: ${num(s.mine)} peças minhas`
          : `Costura: equipe ${num(s.team)} peças`,
      subtitle: num(s.mine) > 0 && num(s.team) > 0 ? `Equipe: ${num(s.team)} peças` : null,
      amount: num(s.value),
      done: true,
      href: '/dashboard/costura'
    })),
    ...salon.map((s) => ({
      key: `c${s.date}`,
      date: String(s.date),
      kind: 'salao' as const,
      title: `Salão: ${num(s.cuts)} cortes`,
      subtitle: null,
      amount: num(s.mine),
      done: true,
      href: '/dashboard/cabeleireiro'
    }))
  ];

  return { month, events };
});
