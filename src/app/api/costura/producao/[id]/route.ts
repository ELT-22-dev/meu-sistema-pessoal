import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sewingEntries } from '@/db/schema';
import { checkEntryRefs } from '@/server/sewing';
import { sewingEntrySchema } from '@/features/sewing/schema';
import { handler, notFound, parseBody, parseId } from '@/lib/api-handler';

export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, sewingEntrySchema);
  const current = await db.query.sewingEntries.findFirst({ where: eq(sewingEntries.id, id) });
  if (!current) throw notFound('Lançamento');

  // Preço informado vence; senão mantém o original, ou usa o do novo modelo se ele mudou.
  const modelPrice = await checkEntryRefs(data.modelId, data.workerId);
  const unitPrice =
    data.unitPrice ?? (data.modelId !== current.modelId ? modelPrice : current.unitPrice);

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
