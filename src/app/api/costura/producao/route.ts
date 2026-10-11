import { and, between, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { db } from '@/db';
import { sewingEntries, sewingModels } from '@/db/schema';
import { sewingEntrySchema } from '@/features/sewing/schema';
import { HttpError, created, handler, param, parseBody } from '@/lib/api-handler';
import { addDaysISO, todayISO } from '@/lib/format';

export const GET = handler(async (req) => {
  const to = param(req, 'to') ?? todayISO();
  const from = param(req, 'from') ?? addDaysISO(to, -30);
  const modelId = Number(param(req, 'modelId')) || undefined;

  return db
    .select({
      ...getTableColumns(sewingEntries),
      modelName: sewingModels.name,
      total: sql<number>`${sewingEntries.quantity} * ${sewingEntries.unitPrice}`.mapWith(Number)
    })
    .from(sewingEntries)
    .innerJoin(sewingModels, eq(sewingEntries.modelId, sewingModels.id))
    .where(
      and(
        between(sewingEntries.date, from, to),
        modelId ? eq(sewingEntries.modelId, modelId) : undefined
      )
    )
    .orderBy(desc(sewingEntries.date), desc(sewingEntries.id));
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, sewingEntrySchema);
  const model = await db.query.sewingModels.findFirst({
    where: eq(sewingModels.id, data.modelId)
  });
  if (!model) throw new HttpError(400, 'Modelo não encontrado');

  const [row] = await db
    .insert(sewingEntries)
    .values({ ...data, unitPrice: model.pricePerPiece })
    .returning();
  return created(row);
});
