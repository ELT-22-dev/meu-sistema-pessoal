import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sewingWorkers } from '@/db/schema';
import { sewingWorkerSchema } from '@/features/sewing/schema';
import { handler, notFound, parseBody, parseId } from '@/lib/api-handler';

export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, sewingWorkerSchema);
  const [row] = await db
    .update(sewingWorkers)
    .set(data)
    .where(eq(sewingWorkers.id, id))
    .returning();
  if (!row) throw notFound('Pessoa');
  return row;
});

// Com produção lançada o FK (restrict) impede a exclusão → 409; aí o caminho é desativar.
export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const [row] = await db
    .delete(sewingWorkers)
    .where(eq(sewingWorkers.id, id))
    .returning({ id: sewingWorkers.id });
  if (!row) throw notFound('Pessoa');
  return { ok: true };
});
