import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { handler } from '@/lib/api-handler';

/** Último preço usado para cada (pessoa, modelo) — sugestão no lançamento. */
export const GET = handler(async () => {
  const rows = await db.execute(sql`
    select distinct on (worker_id, model_id) worker_id, model_id, unit_price
    from sewing_entries
    order by worker_id, model_id, date desc, id desc`);
  return rows.map((r) => ({
    workerId: r.worker_id == null ? null : Number(r.worker_id),
    modelId: Number(r.model_id),
    unitPrice: Number(r.unit_price)
  }));
});
