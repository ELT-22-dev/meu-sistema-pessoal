import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { clients, projects, tasks, transactions } from '@/db/schema';
import { projectSchema } from '@/features/projects/schema';
import { handler, notFound, parseBody, parseId } from '@/lib/api-handler';

export const GET = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!project) throw notFound('Projeto');

  const [client, projectTasks, payments] = await Promise.all([
    project.clientId
      ? db.query.clients.findFirst({ where: eq(clients.id, project.clientId) })
      : null,
    db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, id))
      .orderBy(asc(tasks.done), sql`${tasks.dueDate} asc nulls last`, asc(tasks.id)),
    db
      .select()
      .from(transactions)
      .where(and(eq(transactions.projectId, id), eq(transactions.type, 'receita')))
      .orderBy(desc(transactions.date))
  ]);

  const received = payments
    .filter((p) => p.status === 'pago')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return { ...project, client: client ?? null, tasks: projectTasks, payments, received };
});

export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, projectSchema);
  const [row] = await db.update(projects).set(data).where(eq(projects.id, id)).returning();
  if (!row) throw notFound('Projeto');
  return row;
});

export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const [row] = await db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id });
  if (!row) throw notFound('Projeto');
  return { ok: true };
});
