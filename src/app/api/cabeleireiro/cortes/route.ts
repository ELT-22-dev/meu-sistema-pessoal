import { between, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { db } from '@/db';
import { haircutEntries, haircutServices } from '@/db/schema';
import { haircutEntrySchema } from '@/features/haircut/schema';
import { HttpError, created, handler, param, parseBody } from '@/lib/api-handler';
import { addDaysISO, todayISO } from '@/lib/format';

export const GET = handler(async (req) => {
  const to = param(req, 'to') ?? todayISO();
  const from = param(req, 'from') ?? addDaysISO(to, -90);

  return db
    .select({
      ...getTableColumns(haircutEntries),
      serviceName: haircutServices.name,
      total: sql<number>`${haircutEntries.quantity} * ${haircutEntries.unitPrice}`.mapWith(Number),
      mine: sql<number>`round(${haircutEntries.quantity} * ${haircutEntries.unitPrice} * ${haircutEntries.commissionPct} / 100, 2)`.mapWith(
        Number
      )
    })
    .from(haircutEntries)
    .innerJoin(haircutServices, eq(haircutEntries.serviceId, haircutServices.id))
    .where(between(haircutEntries.date, from, to))
    .orderBy(desc(haircutEntries.date), desc(haircutEntries.id));
});

export const POST = handler(async (req) => {
  const data = await parseBody(req, haircutEntrySchema);
  const service = await db.query.haircutServices.findFirst({
    where: eq(haircutServices.id, data.serviceId)
  });
  if (!service) throw new HttpError(400, 'Tipo de corte não encontrado');

  const [row] = await db
    .insert(haircutEntries)
    .values({
      ...data,
      unitPrice: data.unitPrice ?? service.price,
      commissionPct: data.commissionPct ?? service.commissionPct
    })
    .returning();
  return created(row);
});
