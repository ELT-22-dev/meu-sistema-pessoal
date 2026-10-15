import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { handler, param } from '@/lib/api-handler';
import { addDaysISO, monthRange, shiftMonth, todayISO } from '@/lib/format';
import { syncRecurring } from '@/server/recurring';

const num = (v: unknown) => Number(v ?? 0);

/** Números do painel inicial. */
export const GET = handler(async (req) => {
  const today = /^\d{4}-\d{2}-\d{2}$/.test(param(req, 'today') ?? '')
    ? param(req, 'today')!
    : todayISO();
  const month = today.slice(0, 7);
  const { from, to } = monthRange(month);
  const prev = monthRange(shiftMonth(month, -1));
  const sixMonthsFrom = `${shiftMonth(month, -5)}-01`;
  const soon = addDaysISO(today, 14);
  await syncRecurring(month);

  const [
    monthRows,
    prevRows,
    receivableRows,
    sewingRows,
    monthly,
    byArea,
    deadlines,
    tasksDue,
    recent
  ] = await Promise.all([
    db.execute(sql`
      select coalesce(sum(amount) filter (where type = 'receita' and status = 'pago'), 0) as income,
             coalesce(sum(amount) filter (where type = 'despesa' and status = 'pago'), 0) as expense,
             coalesce(sum(amount) filter (where type = 'despesa' and status = 'pendente'), 0) as to_pay
      from transactions where date between ${from} and ${to}`),
    db.execute(sql`
      select coalesce(sum(amount) filter (where type = 'receita' and status = 'pago'), 0) as income
      from transactions where date between ${prev.from} and ${prev.to}`),
    db.execute(sql`
      select
        (select coalesce(sum(greatest(p.value - coalesce((
            select sum(t.amount) from transactions t
            where t.project_id = p.id and t.type = 'receita' and t.status = 'pago'), 0), 0)), 0)
         from projects p where p.status in ('andamento', 'revisao', 'concluido')) as projects,
        (select coalesce(sum(amount), 0) from transactions
         where type = 'receita' and status = 'pendente' and date <= ${to}
           and (project_id is null or recurring_id is not null)) as pending_income,
        (select count(*) from projects where status in ('andamento', 'revisao')) as active_projects,
        (select count(*) from quotes where status in ('rascunho', 'enviado')) as open_quotes`),
    db.execute(sql`
      select
        (select coalesce(sum(quantity * unit_price), 0) from sewing_entries where worker_id is null)
          - (select coalesce(sum(amount), 0) from sewing_payments) as balance,
        (select coalesce(sum(quantity), 0) from sewing_entries
         where worker_id is null and date between ${from} and ${to}) as month_pieces,
        (select coalesce(sum(quantity * unit_price), 0) from sewing_entries
         where worker_id is null and date between ${from} and ${to}) as month_value,
        (select coalesce(sum(quantity), 0) from sewing_entries where worker_id is null and date = ${today}) as today_pieces`),
    db.execute(sql`
      select to_char(date, 'YYYY-MM') as month,
             coalesce(sum(amount) filter (where type = 'receita'), 0) as income,
             coalesce(sum(amount) filter (where type = 'despesa'), 0) as expense
      from transactions
      where status = 'pago' and date between ${sixMonthsFrom} and ${to}
      group by 1 order by 1`),
    db.execute(sql`
      select area, sum(amount) as value from transactions
      where type = 'receita' and status = 'pago' and date between ${sixMonthsFrom} and ${to}
      group by area order by value desc`),
    db.execute(sql`
      select p.id, p.title, p.due_date::text as due_date, p.status, c.name as client_name
      from projects p left join clients c on c.id = p.client_id
      where p.due_date is not null and p.due_date <= ${soon}
        and p.status in ('lead', 'andamento', 'revisao', 'pausado')
      order by p.due_date limit 8`),
    db.execute(sql`
      select k.id, k.title, k.due_date::text as due_date, p.id as project_id, p.title as project_title
      from tasks k join projects p on p.id = k.project_id
      where not k.done and k.due_date is not null and k.due_date <= ${soon}
      order by k.due_date limit 8`),
    db.execute(sql`
      select id, type, area, description, amount, date::text as date, status
      from transactions order by date desc, id desc limit 6`)
  ]);

  // Preenche os 6 meses mesmo sem movimento.
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));
  const monthlyMap = new Map(monthly.map((r) => [String(r.month), r]));

  const m = monthRows[0];
  const r = receivableRows[0];
  const s = sewingRows[0];

  return {
    month,
    income: num(m.income),
    expense: num(m.expense),
    balance: num(m.income) - num(m.expense),
    toPay: num(m.to_pay),
    prevIncome: num(prevRows[0].income),
    receivable: {
      projects: num(r.projects),
      sewing: Math.max(0, num(s.balance)),
      other: num(r.pending_income)
    },
    activeProjects: num(r.active_projects),
    openQuotes: num(r.open_quotes),
    sewing: {
      monthPieces: num(s.month_pieces),
      monthValue: num(s.month_value),
      todayPieces: num(s.today_pieces)
    },
    monthly: months.map((mm) => ({
      month: mm,
      income: num(monthlyMap.get(mm)?.income),
      expense: num(monthlyMap.get(mm)?.expense)
    })),
    byArea: byArea.map((a) => ({ area: String(a.area), value: num(a.value) })),
    deadlines: deadlines.map((d) => ({
      id: num(d.id),
      title: String(d.title),
      dueDate: String(d.due_date),
      status: String(d.status),
      clientName: d.client_name ? String(d.client_name) : null
    })),
    tasksDue: tasksDue.map((t) => ({
      id: num(t.id),
      title: String(t.title),
      dueDate: String(t.due_date),
      projectId: num(t.project_id),
      projectTitle: String(t.project_title)
    })),
    recent: recent.map((t) => ({
      id: num(t.id),
      type: String(t.type),
      area: String(t.area),
      description: String(t.description),
      amount: num(t.amount),
      date: String(t.date),
      status: String(t.status)
    }))
  };
});
