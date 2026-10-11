import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { clients, quoteItems, quotes } from '@/db/schema';
import { quoteSchema, quoteTotals } from '@/features/quotes/schema';
import { handler, notFound, parseBody, parseId } from '@/lib/api-handler';

export const GET = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, id) });
  if (!quote) throw notFound('Orçamento');

  const [items, client] = await Promise.all([
    db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, id))
      .orderBy(asc(quoteItems.position), asc(quoteItems.id)),
    quote.clientId ? db.query.clients.findFirst({ where: eq(clients.id, quote.clientId) }) : null
  ]);

  return { ...quote, items, client: client ?? null, ...quoteTotals(items, quote.discount) };
});

export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const { items, ...data } = await parseBody(req, quoteSchema);

  const quote = await db.transaction(async (tx) => {
    const [row] = await tx.update(quotes).set(data).where(eq(quotes.id, id)).returning();
    if (!row) throw notFound('Orçamento');
    // Itens são substituídos por inteiro a cada edição.
    await tx.delete(quoteItems).where(eq(quoteItems.quoteId, id));
    await tx
      .insert(quoteItems)
      .values(items.map((item, position) => ({ ...item, quoteId: id, position })));
    return row;
  });
  return quote;
});

export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const [row] = await db.delete(quotes).where(eq(quotes.id, id)).returning({ id: quotes.id });
  if (!row) throw notFound('Orçamento');
  return { ok: true };
});
