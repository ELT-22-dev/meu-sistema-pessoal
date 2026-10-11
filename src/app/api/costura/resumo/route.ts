import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { handler, param } from '@/lib/api-handler';
import { addDaysISO, monthRange, todayISO, weekStartISO } from '@/lib/format';

type Totals = { pieces: number; value: number; days: number };

const num = (v: unknown) => Number(v ?? 0);

/** Resumo da produção: hoje, semana, mês, saldo a receber da oficina e séries. */
export const GET = handler(async (req) => {
  // O cliente manda a data local dele para "hoje" não depender do fuso do servidor.
  const today = /^\d{4}-\d{2}-\d{2}$/.test(param(req, 'today') ?? '')
    ? param(req, 'today')!
    : todayISO();
  const week = weekStartISO(today);
  const { from: monthFrom } = monthRange(today.slice(0, 7));
  const seriesFrom = addDaysISO(today, -29);

  const totals = (from: string) => sql`
    select coalesce(sum(quantity), 0) as pieces,
           coalesce(sum(quantity * unit_price), 0) as value,
           count(distinct date) as days
    from sewing_entries where date between ${from} and ${today}`;

  const [todayRows, weekRows, monthRows, balanceRows, series, byModel, lastPayment] =
    await Promise.all([
      db.execute(totals(today)),
      db.execute(totals(week)),
      db.execute(totals(monthFrom)),
      db.execute(sql`
        select (select coalesce(sum(quantity * unit_price), 0) from sewing_entries) as produced,
               (select coalesce(sum(amount), 0) from sewing_payments) as paid`),
      db.execute(sql`
        select date::text as date, sum(quantity) as pieces, sum(quantity * unit_price) as value
        from sewing_entries where date between ${seriesFrom} and ${today}
        group by date order by date`),
      db.execute(sql`
        select m.id, m.name, sum(e.quantity) as pieces, sum(e.quantity * e.unit_price) as value
        from sewing_entries e join sewing_models m on m.id = e.model_id
        where e.date between ${monthFrom} and ${today}
        group by m.id, m.name order by pieces desc`),
      db.execute(sql`select date::text as date, amount from sewing_payments
        order by date desc, id desc limit 1`)
    ]);

  const toTotals = (rows: Record<string, unknown>[]): Totals => ({
    pieces: num(rows[0]?.pieces),
    value: num(rows[0]?.value),
    days: num(rows[0]?.days)
  });

  const produced = num(balanceRows[0]?.produced);
  const paid = num(balanceRows[0]?.paid);

  return {
    today: toTotals(todayRows),
    week: toTotals(weekRows),
    month: toTotals(monthRows),
    produced,
    paid,
    balance: Math.round((produced - paid) * 100) / 100,
    lastPayment: lastPayment[0]
      ? { date: String(lastPayment[0].date), amount: num(lastPayment[0].amount) }
      : null,
    series: series.map((r) => ({
      date: String(r.date),
      pieces: num(r.pieces),
      value: num(r.value)
    })),
    byModel: byModel.map((r) => ({
      id: num(r.id),
      name: String(r.name),
      pieces: num(r.pieces),
      value: num(r.value)
    }))
  };
});
