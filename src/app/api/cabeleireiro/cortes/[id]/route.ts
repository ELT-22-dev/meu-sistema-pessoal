import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { haircutEntries, haircutServices } from '@/db/schema';
import { haircutEntrySchema } from '@/features/haircut/schema';
import { HttpError, handler, notFound, parseBody, parseId } from '@/lib/api-handler';

export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, haircutEntrySchema);
  const current = await db.query.haircutEntries.findFirst({ where: eq(haircutEntries.id, id) });
  if (!current) throw notFound('Lançamento');
  const service = await db.query.haircutServices.findFirst({
    where: eq(haircutServices.id, data.serviceId)
  });
  if (!service) throw new HttpError(400, 'Tipo de corte não encontrado');

  // Valor informado vence; senão mantém o do lançamento, ou o do novo tipo se ele mudou.
  const changed = data.serviceId !== current.serviceId;
  const [row] = await db
    .update(haircutEntries)
    .set({
      ...data,
      unitPrice: data.unitPrice ?? (changed ? service.price : current.unitPrice),
      commissionPct: data.commissionPct ?? (changed ? service.commissionPct : current.commissionPct)
    })
    .where(eq(haircutEntries.id, id))
    .returning();
  return row;
});

export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const [row] = await db
    .delete(haircutEntries)
    .where(eq(haircutEntries.id, id))
    .returning({ id: haircutEntries.id });
  if (!row) throw notFound('Lançamento');
  return { ok: true };
});
