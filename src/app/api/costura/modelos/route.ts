import { asc, desc, getTableColumns, sql } from 'drizzle-orm';
import { db } from '@/db';
import { sewingModels } from '@/db/schema';
import { sewingModelSchema } from '@/features/sewing/schema';
import { created, handler, parseBody } from '@/lib/api-handler';

export const GET = handler(async () => {
  return db
    .select({
      ...getTableColumns(sewingModels),
      totalPieces: sql<number>`(
        select coalesce(sum(e.quantity), 0) from sewing_entries e where e.model_id = ${sewingModels.id}
      )`.mapWith(Number),
      lastUsed: sql<string | null>`(
        select max(e.date)::text from sewing_entries e where e.model_id = ${sewingModels.id}
      )`
    })
    .from(sewingModels)
    .orderBy(desc(sewingModels.active), asc(sewingModels.name));
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, sewingModelSchema);
  const [row] = await db.insert(sewingModels).values(data).returning();
  return created(row);
});
