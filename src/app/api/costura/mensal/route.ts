import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { handler } from '@/lib/api-handler';

const num = (v: unknown) => Number(v ?? 0);

type ModelLine = { modelId: number; name: string; pieces: number; value: number };
type Person = {
  workerId: number | null;
  name: string;
  role: string | null;
  pieces: number;
  value: number;
  models: ModelLine[];
};

/**
 * Produção por mês: para cada mês, cada pessoa (eu primeiro, depois a equipe) com
 * a quantidade e o valor por modelo de peça.
 */
export const GET = handler(async () => {
  const rows = await db.execute(sql`
    select to_char(e.date, 'YYYY-MM') as month,
           e.worker_id, w.name as worker_name, w.role as worker_role,
           e.model_id, m.name as model_name,
           sum(e.quantity) as pieces, sum(e.quantity * e.unit_price) as value,
           count(*) as entries
    from sewing_entries e
    join sewing_models m on m.id = e.model_id
    left join sewing_workers w on w.id = e.worker_id
    group by 1, e.worker_id, w.name, w.role, e.model_id, m.name
    order by 1 desc, (e.worker_id is not null), w.name, pieces desc`);

  const months = new Map<string, { month: string; entries: number; people: Person[] }>();
  for (const r of rows) {
    const key = String(r.month);
    let month = months.get(key);
    if (!month) {
      month = { month: key, entries: 0, people: [] };
      months.set(key, month);
    }
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
    person.value = Math.round((person.value + line.value) * 100) / 100;
  }

  return [...months.values()];
});
