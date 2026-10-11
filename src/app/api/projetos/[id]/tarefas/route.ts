import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { taskSchema } from '@/features/projects/schema';
import { created, handler, notFound, parseBody, parseId } from '@/lib/api-handler';

export const POST = handler(async (req, ctx) => {
  const projectId = await parseId(ctx);
  const data = await parseBody(req, taskSchema);
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) throw notFound('Projeto');
  const [row] = await db
    .insert(tasks)
    .values({ ...data, projectId })
    .returning();
  return created(row);
});
