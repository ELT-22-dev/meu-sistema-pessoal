import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { sewingPayments, transactions } from '@/db/schema';
import { paymentDescription, sewingPaymentSchema } from '@/features/sewing/schema';
import { created, handler, parseBody } from '@/lib/api-handler';

export const GET = handler(async () => {
  return db
    .select()
    .from(sewingPayments)
    .orderBy(desc(sewingPayments.date), desc(sewingPayments.id));
});

/** Registra o pagamento e cria a receita correspondente no financeiro. */
export const POST = handler(async (req) => {
  const data = await parseBody(req, sewingPaymentSchema);
  const payment = await db.transaction(async (tx) => {
    const [row] = await tx.insert(sewingPayments).values(data).returning();
    await tx.insert(transactions).values({
      type: 'receita',
      area: 'costura',
      category: 'Costura',
      description: paymentDescription(row),
      amount: row.amount,
      date: row.date,
      status: 'pago',
      sewingPaymentId: row.id
    });
    return row;
  });
  return created(payment);
});
