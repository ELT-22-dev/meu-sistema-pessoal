import { asc, desc, getTableColumns, sql } from 'drizzle-orm';
import { db } from '@/db';
import { haircutServices } from '@/db/schema';
import { haircutServiceSchema } from '@/features/haircut/schema';
import { created, handler, parseBody } from '@/lib/api-handler';

export const GET = handler(async () => {
  return db
    .select({
      ...getTableColumns(haircutServices),
      totalCuts: sql<number>`(select coalesce(sum(e.quantity), 0) from haircut_entries e
        where e.service_id = "haircut_services"."id")`.mapWith(Number)
    })
    .from(haircutServices)
    .orderBy(desc(haircutServices.active), asc(haircutServices.price), asc(haircutServices.name));
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, haircutServiceSchema);
  const [row] = await db.insert(haircutServices).values(data).returning();
  return created(row);
});
