import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { haircutPayments, transactions } from '@/db/schema';
import { haircutPaymentDescription, haircutPaymentSchema } from '@/features/haircut/schema';
import { handler, notFound, parseBody, parseId } from '@/lib/api-handler';

export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, haircutPaymentSchema);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(haircutPayments)
      .set(data)
      .where(eq(haircutPayments.id, id))
      .returning();
    if (!row) throw notFound('Pagamento');
    await tx
      .update(transactions)
      .set({ amount: row.amount, date: row.date, description: haircutPaymentDescription(row) })
      .where(eq(transactions.haircutPaymentId, id));
    return row;
  });
});

// A receita no financeiro é removida junto (FK on delete cascade).
export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const [row] = await db
    .delete(haircutPayments)
    .where(eq(haircutPayments.id, id))
    .returning({ id: haircutPayments.id });
  if (!row) throw notFound('Pagamento');
  return { ok: true };
});
