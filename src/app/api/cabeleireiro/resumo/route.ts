import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { handler, param } from '@/lib/api-handler';
import { monthRange, todayISO } from '@/lib/format';

const num = (v: unknown) => Number(v ?? 0);
const MINE = sql.raw('round(quantity * unit_price * commission_pct / 100, 2)');

/** Resumo do cabeleireiro: mês atual, saldo a receber do salão e por tipo de corte. */
export const GET = handler(async (req) => {
  const today = /^\d{4}-\d{2}-\d{2}$/.test(param(req, 'today') ?? '')
    ? param(req, 'today')!
    : todayISO();
  const { from, to } = monthRange(today.slice(0, 7));

  const [monthRows, balanceRows, byService, lastPayment] = await Promise.all([
    db.execute(sql`
      select coalesce(sum(quantity), 0) as cuts,
             coalesce(sum(quantity * unit_price), 0) as gross,
             coalesce(sum(${MINE}), 0) as mine,
             count(distinct date) as days
      from haircut_entries where date between ${from} and ${to}`),
    db.execute(sql`
      select (select coalesce(sum(${MINE}), 0) from haircut_entries) as earned,
             (select coalesce(sum(amount), 0) from haircut_payments) as paid`),
    db.execute(sql`
      select s.id, s.name, sum(e.quantity) as cuts, sum(round(e.quantity * e.unit_price * e.commission_pct / 100, 2)) as mine
      from haircut_entries e join haircut_services s on s.id = e.service_id
      where e.date between ${from} and ${to}
      group by s.id, s.name order by cuts desc`),
    db.execute(sql`select date::text as date, amount from haircut_payments
      order by date desc, id desc limit 1`)
  ]);

  const m = monthRows[0];
  const earned = num(balanceRows[0]?.earned);
  const paid = num(balanceRows[0]?.paid);
  return {
    month: { cuts: num(m?.cuts), gross: num(m?.gross), mine: num(m?.mine), days: num(m?.days) },
    earned,
    paid,
    balance: Math.round((earned - paid) * 100) / 100,
    lastPayment: lastPayment[0]
      ? { date: String(lastPayment[0].date), amount: num(lastPayment[0].amount) }
      : null,
    byService: byService.map((r) => ({
      id: num(r.id),
      name: String(r.name),
      cuts: num(r.cuts),
      mine: num(r.mine)
    }))
  };
});
