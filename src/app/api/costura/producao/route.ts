import { and, between, desc, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { sewingEntries, sewingModels, sewingWorkers } from '@/db/schema';
import { checkEntryRefs } from '@/server/sewing';
import { sewingEntrySchema } from '@/features/sewing/schema';
import { created, handler, param, parseBody } from '@/lib/api-handler';
import { addDaysISO, todayISO } from '@/lib/format';

export const GET = handler(async (req) => {
  const to = param(req, 'to') ?? todayISO();
  const from = param(req, 'from') ?? addDaysISO(to, -30);
  const modelId = Number(param(req, 'modelId')) || undefined;
  // 'eu' = só a minha produção; número = uma pessoa da equipe
  const worker = param(req, 'worker');

  return db
    .select({
      ...getTableColumns(sewingEntries),
      modelName: sewingModels.name,
      workerName: sewingWorkers.name,
      total: sql<number>`${sewingEntries.quantity} * ${sewingEntries.unitPrice}`.mapWith(Number)
    })
    .from(sewingEntries)
    .innerJoin(sewingModels, eq(sewingEntries.modelId, sewingModels.id))
    .leftJoin(sewingWorkers, eq(sewingEntries.workerId, sewingWorkers.id))
    .where(
      and(
        between(sewingEntries.date, from, to),
        modelId ? eq(sewingEntries.modelId, modelId) : undefined,
        worker === 'eu'
          ? isNull(sewingEntries.workerId)
          : Number(worker)
            ? eq(sewingEntries.workerId, Number(worker))
            : undefined
      )
    )
    .orderBy(desc(sewingEntries.date), desc(sewingEntries.id));
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, sewingEntrySchema);
  const modelPrice = await checkEntryRefs(data.modelId, data.workerId);

  const [row] = await db
    .insert(sewingEntries)
    .values({ ...data, unitPrice: data.unitPrice ?? modelPrice })
    .returning();
  return created(row);
});
