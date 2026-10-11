import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sewingModels } from '@/db/schema';
import { sewingModelSchema } from '@/features/sewing/schema';
import { handler, notFound, parseBody, parseId } from '@/lib/api-handler';

// Alterar o preço não muda lançamentos antigos: cada produção guarda o preço do dia.
export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, sewingModelSchema);
  const [row] = await db.update(sewingModels).set(data).where(eq(sewingModels.id, id)).returning();
  if (!row) throw notFound('Modelo');
  return row;
});

// Com produção lançada, o FK (restrict) impede a exclusão → 409; aí o caminho é desativar.
export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const [row] = await db
    .delete(sewingModels)
    .where(eq(sewingModels.id, id))
    .returning({ id: sewingModels.id });
  if (!row) throw notFound('Modelo');
  return { ok: true };
});
