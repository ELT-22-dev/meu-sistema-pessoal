import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sewingEntries, sewingModels } from '@/db/schema';
import { sewingEntrySchema } from '@/features/sewing/schema';
import { HttpError, handler, notFound, parseBody, parseId } from '@/lib/api-handler';

export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, sewingEntrySchema);
  const current = await db.query.sewingEntries.findFirst({ where: eq(sewingEntries.id, id) });
  if (!current) throw notFound('Lançamento');

  // Mantém o preço original, a menos que o modelo tenha mudado.
  let unitPrice = current.unitPrice;
  if (data.modelId !== current.modelId) {
    const model = await db.query.sewingModels.findFirst({
      where: eq(sewingModels.id, data.modelId)
    });
    if (!model) throw new HttpError(400, 'Modelo não encontrado');
    unitPrice = model.pricePerPiece;
  }

  const [row] = await db
    .update(sewingEntries)
    .set({ ...data, unitPrice })
    .where(eq(sewingEntries.id, id))
    .returning();
  return row;
});

export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const [row] = await db
    .delete(sewingEntries)
    .where(eq(sewingEntries.id, id))
    .returning({ id: sewingEntries.id });
  if (!row) throw notFound('Lançamento');
  return { ok: true };
});
