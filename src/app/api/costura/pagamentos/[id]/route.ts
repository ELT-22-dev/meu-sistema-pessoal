import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sewingPayments, transactions } from '@/db/schema';
import { paymentDescription, sewingPaymentSchema } from '@/features/sewing/schema';
import { handler, notFound, parseBody, parseId } from '@/lib/api-handler';

export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, sewingPaymentSchema);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(sewingPayments)
      .set(data)
      .where(eq(sewingPayments.id, id))
      .returning();
    if (!row) throw notFound('Pagamento');
    await tx
      .update(transactions)
      .set({ amount: row.amount, date: row.date, description: paymentDescription(row) })
      .where(eq(transactions.sewingPaymentId, id));
    return row;
  });
});

// A receita no financeiro é removida junto (FK on delete cascade).
export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const [row] = await db
    .delete(sewingPayments)
    .where(eq(sewingPayments.id, id))
    .returning({ id: sewingPayments.id });
  if (!row) throw notFound('Pagamento');
  return { ok: true };
});
