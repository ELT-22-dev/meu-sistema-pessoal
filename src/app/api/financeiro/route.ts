import { and, between, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { clients, projects, transactions } from '@/db/schema';
import { transactionSchema } from '@/features/finance/schema';
import { created, handler, param, parseBody } from '@/lib/api-handler';
import { currentMonth, monthRange } from '@/lib/format';
import { like } from '@/server/sql';

const sumWhere = (cond: ReturnType<typeof sql>) =>
  sql<number>`coalesce(sum(${transactions.amount}) filter (where ${cond}), 0)`.mapWith(Number);

export const GET = handler(async (req) => {
  const month = /^\d{4}-\d{2}$/.test(param(req, 'month') ?? '')
    ? param(req, 'month')!
    : currentMonth();
  const { from, to } = monthRange(month);
  const type = param(req, 'type');
  const area = param(req, 'area');
  const status = param(req, 'status');
  const search = param(req, 'search');

  const inMonth = between(transactions.date, from, to);
  const filters = and(
    inMonth,
    type ? eq(transactions.type, type) : undefined,
    area ? eq(transactions.area, area) : undefined,
    status ? eq(transactions.status, status) : undefined,
    search
      ? or(
          ilike(transactions.description, like(search)),
          ilike(transactions.category, like(search))
        )
      : undefined
  );

  const [items, [summary], [overdue]] = await Promise.all([
    db
      .select({
        ...getTableColumns(transactions),
        clientName: clients.name,
        projectTitle: projects.title
      })
      .from(transactions)
      .leftJoin(clients, eq(transactions.clientId, clients.id))
      .leftJoin(projects, eq(transactions.projectId, projects.id))
      .where(filters)
      .orderBy(desc(transactions.date), desc(transactions.id)),
    // Resumo do mês inteiro (ignora filtros de busca).
    db
      .select({
        income: sumWhere(sql`${transactions.type} = 'receita' and ${transactions.status} = 'pago'`),
        expense: sumWhere(
          sql`${transactions.type} = 'despesa' and ${transactions.status} = 'pago'`
        ),
        pendingIncome: sumWhere(
          sql`${transactions.type} = 'receita' and ${transactions.status} = 'pendente'`
        ),
        pendingExpense: sumWhere(
          sql`${transactions.type} = 'despesa' and ${transactions.status} = 'pendente'`
        )
      })
      .from(transactions)
      .where(inMonth),
    // Pendências de meses anteriores ainda em aberto.
    db
      .select({
        income: sumWhere(sql`${transactions.type} = 'receita'`),
        expense: sumWhere(sql`${transactions.type} = 'despesa'`)
      })
      .from(transactions)
      .where(and(eq(transactions.status, 'pendente'), sql`${transactions.date} < ${from}`))
  ]);

  return {
    month,
    items,
    summary: { ...summary, balance: summary.income - summary.expense },
    overdue
  };
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, transactionSchema);
  const [row] = await db.insert(transactions).values(data).returning();
  return created(row);
});
