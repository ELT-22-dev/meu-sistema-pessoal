import { asc, desc, getTableColumns, sql } from 'drizzle-orm';
import { db } from '@/db';
import { sewingWorkers } from '@/db/schema';
import { sewingWorkerSchema } from '@/features/sewing/schema';
import { created, handler, param, parseBody } from '@/lib/api-handler';
import { monthRange, todayISO } from '@/lib/format';

export const GET = handler(async (req) => {
  const today = /^\d{4}-\d{2}-\d{2}$/.test(param(req, 'today') ?? '')
    ? param(req, 'today')!
    : todayISO();
  const { from } = monthRange(today.slice(0, 7));

  return db
    .select({
      ...getTableColumns(sewingWorkers),
      monthPieces: sql<number>`(select coalesce(sum(e.quantity), 0) from sewing_entries e
        where e.worker_id = "sewing_workers"."id" and e.date between ${from} and ${today})`.mapWith(
        Number
      ),
      monthValue:
        sql<number>`(select coalesce(sum(e.quantity * e.unit_price), 0) from sewing_entries e
        where e.worker_id = "sewing_workers"."id" and e.date between ${from} and ${today})`.mapWith(
          Number
        ),
      todayPieces: sql<number>`(select coalesce(sum(e.quantity), 0) from sewing_entries e
        where e.worker_id = "sewing_workers"."id" and e.date = ${today})`.mapWith(Number),
      lastDate: sql<string | null>`(select max(e.date)::text from sewing_entries e
        where e.worker_id = "sewing_workers"."id")`
    })
    .from(sewingWorkers)
    .orderBy(desc(sewingWorkers.active), asc(sewingWorkers.name));
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, sewingWorkerSchema);
  const [row] = await db.insert(sewingWorkers).values(data).returning();
  return created(row);
});
