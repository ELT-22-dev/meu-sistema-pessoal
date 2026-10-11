import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { projects, quoteItems, quotes } from '@/db/schema';
import { quoteTotals } from '@/features/quotes/schema';
import { HttpError, created, handler, notFound, parseId } from '@/lib/api-handler';
import { todayISO } from '@/lib/format';

/** Aprova o orçamento e cria o projeto correspondente. */
export const POST = handler(async (_req, ctx) => {
  const id = await parseId(ctx);

  const project = await db.transaction(async (tx) => {
    const [quote] = await tx.select().from(quotes).where(eq(quotes.id, id)).for('update');
    if (!quote) throw notFound('Orçamento');
    if (quote.projectId) throw new HttpError(409, 'Este orçamento já virou projeto');

    const items = await tx.select().from(quoteItems).where(eq(quoteItems.quoteId, id));
    const { total } = quoteTotals(items, quote.discount);
    const description = [
      'Itens do orçamento:',
      ...items.map((i) => `• ${i.description} (${i.quantity} × R$ ${i.unitPrice.toFixed(2)})`),
      quote.notes ? `\n${quote.notes}` : ''
    ]
      .join('\n')
      .trim();

    const [row] = await tx
      .insert(projects)
      .values({
        title: quote.title,
        clientId: quote.clientId,
        type: 'sistema',
        status: 'andamento',
        value: total,
        startDate: todayISO(),
        description
      })
      .returning();

    await tx.update(quotes).set({ status: 'aprovado', projectId: row.id }).where(eq(quotes.id, id));
    return row;
  });

  return created(project);
});
