import { asc, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { db } from '@/db';
import { clients, projects, recurringCharges } from '@/db/schema';
import { recurringSchema } from '@/features/recurring/schema';
import { created, handler, parseBody } from '@/lib/api-handler';
import { syncRecurring } from '@/server/recurring';

export const GET = handler(async () => {
  await syncRecurring();
  return db
    .select({
      ...getTableColumns(recurringCharges),
      clientName: clients.name,
      projectTitle: projects.title,
      // Cobranças geradas: total pago e pendências em aberto.
      paidCount: sql<number>`(select count(*) from transactions t
        where t.recurring_id = "recurring_charges"."id" and t.status = 'pago')`.mapWith(Number),
      pendingAmount: sql<number>`(select coalesce(sum(t.amount), 0) from transactions t
        where t.recurring_id = "recurring_charges"."id" and t.status = 'pendente'
          and t.date <= current_date)`.mapWith(Number)
    })
    .from(recurringCharges)
    .leftJoin(clients, eq(recurringCharges.clientId, clients.id))
    .leftJoin(projects, eq(recurringCharges.projectId, projects.id))
    .orderBy(desc(recurringCharges.active), asc(recurringCharges.dayOfMonth));
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, recurringSchema);
  const [row] = await db.insert(recurringCharges).values(data).returning();
  await syncRecurring();
  return created(row);
});
