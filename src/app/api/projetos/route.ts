import { and, asc, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { clients, projects } from '@/db/schema';
import { projectSchema } from '@/features/projects/schema';
import { created, handler, param, parseBody } from '@/lib/api-handler';
import { like, projectOpenTasks, projectReceived, projectTotalTasks } from '@/server/sql';

export const GET = handler(async (req) => {
  const search = param(req, 'search');
  const status = param(req, 'status');
  const type = param(req, 'type');
  const clientId = Number(param(req, 'clientId')) || undefined;

  const filters = [
    search ? or(ilike(projects.title, like(search)), ilike(clients.name, like(search))) : undefined,
    status === 'ativos'
      ? sql`${projects.status} in ('lead', 'andamento', 'revisao', 'pausado')`
      : status
        ? eq(projects.status, status)
        : undefined,
    type ? eq(projects.type, type) : undefined,
    clientId ? eq(projects.clientId, clientId) : undefined
  ];

  return (
    db
      .select({
        ...getTableColumns(projects),
        clientName: clients.name,
        received: projectReceived,
        openTasks: projectOpenTasks,
        totalTasks: projectTotalTasks
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(and(...filters))
      // Prazos mais próximos primeiro; sem prazo vai pro fim.
      .orderBy(sql`${projects.dueDate} asc nulls last`, desc(projects.createdAt), asc(projects.id))
  );
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, projectSchema);
  const [row] = await db.insert(projects).values(data).returning();
  return created(row);
});
