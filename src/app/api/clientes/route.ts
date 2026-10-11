import { asc, getTableColumns, ilike, or } from 'drizzle-orm';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { clientSchema } from '@/features/clients/schema';
import { created, handler, param, parseBody } from '@/lib/api-handler';
import { clientProjectCount, clientReceived, like } from '@/server/sql';

export const GET = handler(async (req) => {
  const search = param(req, 'search');
  return db
    .select({
      ...getTableColumns(clients),
      projectCount: clientProjectCount,
      received: clientReceived
    })
    .from(clients)
    .where(
      search
        ? or(
            ilike(clients.name, like(search)),
            ilike(clients.company, like(search)),
            ilike(clients.email, like(search)),
            ilike(clients.phone, like(search))
          )
        : undefined
    )
    .orderBy(asc(clients.name));
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, clientSchema);
  const [row] = await db.insert(clients).values(data).returning();
  return created(row);
});
