import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { handler, param } from '@/lib/api-handler';
import { todayISO } from '@/lib/format';

const num = (v: unknown) => Number(v ?? 0);
const round = (v: number) => Math.round(v * 100) / 100;

type ModelLine = { modelId: number; name: string; pieces: number; value: number };
type Person = {
  workerId: number | null;
  name: string;
  role: string | null;
  pieces: number;
  value: number;
  models: ModelLine[];
};
type Payment = { id: number; kind: string; date: string; amount: number; notes: string | null };
type Month = {
  month: string;
  entries: number;
  people: Person[];
  // tudo que foi lançado no mês, somado por modelo (é a minha produção)
  total: { pieces: number; value: number; models: ModelLine[] };
  // meu acerto com a oficina
  previousBalance: number;
  produced: number;
  payments: Payment[];
  received: number;
  balance: number;
};

/**
 * Produção por mês. Faço o overlock de tudo que a equipe costura, então TODO lançamento
 * conta como produção minha (`total`, por modelo); `people` detalha em nome de quem foi
 * lançado. E o meu acerto com a oficina:
 * saldo do mês anterior + minha produção − (pagamentos, adiantamentos e vales) = saldo
 * que passa para o mês seguinte.
 */
export const GET = handler(async (req) => {
  // O cliente manda a data local dele para o "mês atual" não depender do fuso do servidor.
  const today = /^\d{4}-\d{2}-\d{2}$/.test(param(req, 'today') ?? '')
    ? param(req, 'today')!
    : todayISO();
  const currentMonth = today.slice(0, 7);

  const [rows, paymentRows] = await Promise.all([
    db.execute(sql`
      select to_char(e.date, 'YYYY-MM') as month,
             e.worker_id, w.name as worker_name, w.role as worker_role,
             e.model_id, m.name as model_name,
             sum(e.quantity) as pieces, sum(e.quantity * e.unit_price) as value,
             count(*) as entries
      from sewing_entries e
      join sewing_models m on m.id = e.model_id
      left join sewing_workers w on w.id = e.worker_id
      group by 1, e.worker_id, w.name, w.role, e.model_id, m.name
      order by 1 desc, (e.worker_id is not null), w.name, pieces desc`),
    db.execute(sql`
      select id, kind, month, date::text as date, amount, notes
      from sewing_payments order by date, id`)
  ]);

  const months = new Map<string, Month>();
  const getMonth = (key: string) => {
    let month = months.get(key);
    if (!month) {
      month = {
        month: key,
        entries: 0,
        people: [],
        total: { pieces: 0, value: 0, models: [] },
        previousBalance: 0,
        produced: 0,
        payments: [],
        received: 0,
        balance: 0
      };
      months.set(key, month);
    }
    return month;
  };

  for (const r of rows) {
    const month = getMonth(String(r.month));
    month.entries += num(r.entries);
    const workerId = r.worker_id == null ? null : num(r.worker_id);
    let person = month.people.find((p) => p.workerId === workerId);
    if (!person) {
      person = {
        workerId,
        name: workerId === null ? 'Eu' : String(r.worker_name),
        role: workerId === null ? null : String(r.worker_role),
        pieces: 0,
        value: 0,
        models: []
      };
      month.people.push(person);
    }
    const line = {
      modelId: num(r.model_id),
      name: String(r.model_name),
      pieces: num(r.pieces),
      value: num(r.value)
    };
    person.models.push(line);
    person.pieces += line.pieces;
    person.value = round(person.value + line.value);

    const sum = month.total.models.find((m) => m.modelId === line.modelId);
    if (sum) {
      sum.pieces += line.pieces;
      sum.value = round(sum.value + line.value);
    } else {
      month.total.models.push({ ...line });
    }
    month.total.pieces += line.pieces;
    month.total.value = round(month.total.value + line.value);
  }

  for (const r of paymentRows) {
    const month = getMonth(String(r.month));
    month.payments.push({
      id: num(r.id),
      kind: String(r.kind),
      date: String(r.date),
      amount: num(r.amount),
      notes: r.notes == null ? null : String(r.notes)
    });
    month.received = round(month.received + num(r.amount));
  }

  // Saldo corre do mês mais antigo para o mais novo.
  const ordered = [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
  let carry = 0;
  for (const m of ordered) {
    m.total.models.sort((a, b) => b.pieces - a.pieces);
    m.produced = m.total.value;
    m.previousBalance = carry;
    m.balance = round(carry + m.produced - m.received);
    carry = m.balance;
  }

  // Mês atual ainda sem lançamentos: aparece para mostrar o saldo que sobrou.
  const last = ordered.at(-1);
  if (last && last.month < currentMonth && carry !== 0) {
    const month = getMonth(currentMonth);
    month.previousBalance = carry;
    month.balance = carry;
    ordered.push(month);
  }

  return ordered.reverse();
});
