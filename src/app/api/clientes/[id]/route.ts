import { desc, eq, getTableColumns } from 'drizzle-orm';
import { db } from '@/db';
import { clients, projects, quotes, transactions } from '@/db/schema';
import { clientSchema } from '@/features/clients/schema';
import { handler, notFound, parseBody, parseId } from '@/lib/api-handler';
import { projectReceived, quoteTotal } from '@/server/sql';
import { syncRecurring } from '@/server/recurring';

export const GET = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const client = await db.query.clients.findFirst({ where: eq(clients.id, id) });
  if (!client) throw notFound('Cliente');
  await syncRecurring();

  const [clientProjects, clientQuotes, payments] = await Promise.all([
    db
      .select({ ...getTableColumns(projects), received: projectReceived })
      .from(projects)
      .where(eq(projects.clientId, id))
      .orderBy(desc(projects.createdAt)),
    db
      .select({ ...getTableColumns(quotes), total: quoteTotal })
      .from(quotes)
      .where(eq(quotes.clientId, id))
      .orderBy(desc(quotes.createdAt)),
    db
      .select()
      .from(transactions)
      .where(eq(transactions.clientId, id))
      .orderBy(desc(transactions.date))
      .limit(50)
  ]);

  return { ...client, projects: clientProjects, quotes: clientQuotes, transactions: payments };
});

export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, clientSchema);
  const [row] = await db.update(clients).set(data).where(eq(clients.id, id)).returning();
  if (!row) throw notFound('Cliente');
  return row;
});

export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const [row] = await db.delete(clients).where(eq(clients.id, id)).returning({ id: clients.id });
  if (!row) throw notFound('Cliente');
  return { ok: true };
});
