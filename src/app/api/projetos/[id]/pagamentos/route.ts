import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { projects, transactions } from '@/db/schema';
import { projectPaymentSchema } from '@/features/projects/schema';
import { created, handler, notFound, parseBody, parseId } from '@/lib/api-handler';

/** Registra um pagamento do cliente para o projeto (receita paga no financeiro). */
export const POST = handler(async (req, ctx) => {
  const projectId = await parseId(ctx);
  const data = await parseBody(req, projectPaymentSchema);
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) throw notFound('Projeto');

  const [row] = await db
    .insert(transactions)
    .values({
      type: 'receita',
      area: 'dev',
      category: 'Projeto',
      description: data.description ?? `Pagamento — ${project.title}`,
      amount: data.amount,
      date: data.date,
      status: 'pago',
      projectId,
      clientId: project.clientId
    })
    .returning();
  return created(row);
});
