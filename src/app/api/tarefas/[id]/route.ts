import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { taskUpdateSchema } from '@/features/projects/schema';
import { handler, notFound, parseBody, parseId } from '@/lib/api-handler';

export const PATCH = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, taskUpdateSchema);
  const [row] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
  if (!row) throw notFound('Tarefa');
  return row;
});

export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const [row] = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
  if (!row) throw notFound('Tarefa');
  return { ok: true };
});
