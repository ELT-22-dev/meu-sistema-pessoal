import { and, desc, eq, getTableColumns, ilike, or } from 'drizzle-orm';
import { db } from '@/db';
import { clients, quoteItems, quotes } from '@/db/schema';
import { quoteSchema } from '@/features/quotes/schema';
import { created, handler, param, parseBody } from '@/lib/api-handler';
import { like, quoteTotal } from '@/server/sql';

export const GET = handler(async (req) => {
  const search = param(req, 'search');
  const status = param(req, 'status');

  return db
    .select({ ...getTableColumns(quotes), clientName: clients.name, total: quoteTotal })
    .from(quotes)
    .leftJoin(clients, eq(quotes.clientId, clients.id))
    .where(
      and(
        search
          ? or(ilike(quotes.title, like(search)), ilike(clients.name, like(search)))
          : undefined,
        status ? eq(quotes.status, status) : undefined
      )
    )
    .orderBy(desc(quotes.createdAt));
});

export const POST = handler(async (req) => {
  const { items, ...data } = await parseBody(req, quoteSchema);
  const quote = await db.transaction(async (tx) => {
    const [row] = await tx.insert(quotes).values(data).returning();
    await tx
      .insert(quoteItems)
      .values(items.map((item, position) => ({ ...item, quoteId: row.id, position })));
    return row;
  });
  return created(quote);
});
