import { and, eq, lt } from 'drizzle-orm';
import { db } from '@/db';
import { recurringCharges, transactions } from '@/db/schema';
import { recurringSchema } from '@/features/recurring/schema';
import { handler, notFound, parseBody, parseId } from '@/lib/api-handler';
import { currentMonth } from '@/lib/format';
import { dropFuturePending, refreshPendingCharges, syncRecurring } from '@/server/recurring';

export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, recurringSchema);
  const current = await db.query.recurringCharges.findFirst({ where: eq(recurringCharges.id, id) });
  if (!current) throw notFound('Mensalidade');
  // Início mudou: gera de novo desde o começo (o índice único evita duplicar meses existentes).
  const restart = data.startMonth !== current.startMonth ? { generatedUntil: null } : {};
  const [row] = await db
    .update(recurringCharges)
    .set({ ...data, ...restart })
    .where(eq(recurringCharges.id, id))
    .returning();

  await refreshPendingCharges(row);
  // Início movido para frente: pendências antes dele deixam de existir.
  await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.recurringId, row.id),
        eq(transactions.status, 'pendente'),
        lt(transactions.recurringMonth, row.startMonth)
      )
    );
  // Encerrada ou desativada: tira cobranças pendentes de meses que não serão mais cobrados.
  if (!row.active) await dropFuturePending(row.id, currentMonth());
  else if (row.endMonth) await dropFuturePending(row.id, row.endMonth);
  await syncRecurring();
  return row;
});

// Mantém o histórico (pago/pendente até o mês atual) e remove as cobranças futuras.
export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  await dropFuturePending(id, currentMonth());
  const [row] = await db
    .delete(recurringCharges)
    .where(eq(recurringCharges.id, id))
    .returning({ id: recurringCharges.id });
  if (!row) throw notFound('Mensalidade');
  return { ok: true };
});
