import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { haircutPayments, transactions } from '@/db/schema';
import { haircutPaymentDescription, haircutPaymentSchema } from '@/features/haircut/schema';
import { created, handler, parseBody } from '@/lib/api-handler';

export const GET = handler(async () => {
  return db
    .select()
    .from(haircutPayments)
    .orderBy(desc(haircutPayments.date), desc(haircutPayments.id));
});

/** Registra o pagamento do salão e cria a receita correspondente no financeiro. */
export const POST = handler(async (req) => {
  const data = await parseBody(req, haircutPaymentSchema);
  const payment = await db.transaction(async (tx) => {
    const [row] = await tx.insert(haircutPayments).values(data).returning();
    await tx.insert(transactions).values({
      type: 'receita',
      area: 'cabeleireiro',
      category: 'Cabeleireiro',
      description: haircutPaymentDescription(row),
      amount: row.amount,
      date: row.date,
      status: 'pago',
      haircutPaymentId: row.id
    });
    return row;
  });
  return created(payment);
});
