import 'server-only';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { recurringCharges, transactions, type RecurringCharge } from '@/db/schema';
import { currentMonth, shiftMonth } from '@/lib/format';

/** Data do vencimento no mês: o dia escolhido, ou o último dia se o mês for mais curto. */
export function dueDateFor(month: string, day: number) {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${month}-${String(Math.min(day, last)).padStart(2, '0')}`;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function chargeDescription(description: string, month: string) {
  const [y, m] = month.split('-').map(Number);
  return `${description} — ${MONTHS[m - 1]}/${y}`;
}

/**
 * Gera as cobranças pendentes que faltam, até o mês atual ou `untilMonth` (o maior).
 * Idempotente: o índice único (recurring_id, recurring_month) evita duplicatas, e
 * `generatedUntil` impede que um lançamento excluído seja recriado.
 */
export async function syncRecurring(untilMonth = currentMonth()) {
  // Não gera muito à frente ao navegar por meses futuros.
  const now = currentMonth();
  const cap = shiftMonth(now, 12);
  const target = untilMonth > cap ? cap : untilMonth < now ? now : untilMonth;

  const charges = await db.select().from(recurringCharges).where(eq(recurringCharges.active, true));
  for (const charge of charges) await generateFor(charge, target);
}

async function generateFor(charge: RecurringCharge, target: string) {
  const from = charge.generatedUntil ? shiftMonth(charge.generatedUntil, 1) : charge.startMonth;
  const last = charge.endMonth && charge.endMonth < target ? charge.endMonth : target;
  if (from > last) return;

  const rows: (typeof transactions.$inferInsert)[] = [];
  for (let month = from; month <= last; month = shiftMonth(month, 1)) {
    rows.push({
      type: 'receita',
      area: charge.area,
      category: charge.category,
      description: chargeDescription(charge.description, month),
      amount: charge.amount,
      date: dueDateFor(month, charge.dayOfMonth),
      status: 'pendente',
      clientId: charge.clientId,
      projectId: charge.projectId,
      recurringId: charge.id,
      recurringMonth: month
    });
  }

  await db.transaction(async (tx) => {
    await tx.insert(transactions).values(rows).onConflictDoNothing();
    await tx
      .update(recurringCharges)
      .set({ generatedUntil: last })
      .where(eq(recurringCharges.id, charge.id));
  });
}

/**
 * Após editar a mensalidade, aplica valor/dia/descrição às cobranças ainda pendentes
 * a partir do mês atual (o histórico pago não muda).
 */
export async function refreshPendingCharges(charge: RecurringCharge) {
  const fromMonth = shiftMonth(currentMonth(), -1);
  const pending = await db
    .select({ id: transactions.id, recurringMonth: transactions.recurringMonth })
    .from(transactions)
    .where(
      and(
        eq(transactions.recurringId, charge.id),
        eq(transactions.status, 'pendente'),
        gt(transactions.recurringMonth, fromMonth)
      )
    );
  for (const t of pending) {
    await db
      .update(transactions)
      .set({
        amount: charge.amount,
        date: dueDateFor(t.recurringMonth!, charge.dayOfMonth),
        description: chargeDescription(charge.description, t.recurringMonth!),
        clientId: charge.clientId,
        projectId: charge.projectId,
        area: charge.area,
        category: charge.category
      })
      .where(eq(transactions.id, t.id));
  }
}

/**
 * Remove cobranças pendentes depois de `afterMonth` (ao excluir/encerrar/desativar) e recua
 * o cursor de geração, para que reativar ou estender o fim gere esses meses de novo.
 */
export async function dropFuturePending(chargeId: number, afterMonth: string) {
  await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.recurringId, chargeId),
        eq(transactions.status, 'pendente'),
        gt(transactions.recurringMonth, afterMonth)
      )
    );
  await db
    .update(recurringCharges)
    .set({ generatedUntil: afterMonth })
    .where(and(eq(recurringCharges.id, chargeId), gt(recurringCharges.generatedUntil, afterMonth)));
}
