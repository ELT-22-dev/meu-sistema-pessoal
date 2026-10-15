import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { TX_STATUS_VALUES } from '@/config/options';
import { transactionSchema } from '@/features/finance/schema';
import { HttpError, handler, notFound, parseBody, parseId } from '@/lib/api-handler';

async function findEditable(id: number) {
  const tx = await db.query.transactions.findFirst({ where: eq(transactions.id, id) });
  if (!tx) throw notFound('Lançamento');
  if (tx.sewingPaymentId) {
    throw new HttpError(409, 'Este lançamento vem da Costura — edite pelo módulo Costura');
  }
  if (tx.haircutPaymentId) {
    throw new HttpError(
      409,
      'Este lançamento vem do Cabeleireiro — edite pelo módulo Cabeleireiro'
    );
  }
  return tx;
}

export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  await findEditable(id);
  const data = await parseBody(req, transactionSchema);
  const [row] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
  return row;
});

/** Alterna pago/pendente. */
export const PATCH = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  await findEditable(id);
  const { status } = await parseBody(req, z.object({ status: z.enum(TX_STATUS_VALUES) }));
  const [row] = await db
    .update(transactions)
    .set({ status })
    .where(eq(transactions.id, id))
    .returning();
  return row;
});

export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  await findEditable(id);
  await db.delete(transactions).where(eq(transactions.id, id));
  return { ok: true };
});
