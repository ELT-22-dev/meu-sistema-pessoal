import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { haircutServices } from '@/db/schema';
import { haircutServiceSchema } from '@/features/haircut/schema';
import { handler, notFound, parseBody, parseId } from '@/lib/api-handler';

// Mudar preço/comissão não altera cortes já lançados (cada lançamento guarda os seus).
export const PUT = handler(async (req, ctx) => {
  const id = await parseId(ctx);
  const data = await parseBody(req, haircutServiceSchema);
  const [row] = await db
    .update(haircutServices)
    .set(data)
    .where(eq(haircutServices.id, id))
    .returning();
  if (!row) throw notFound('Tipo de corte');
  return row;
});

// Com cortes lançados o FK (restrict) impede a exclusão → 409; aí o caminho é desativar.
export const DELETE = handler(async (_req, ctx) => {
  const id = await parseId(ctx);
  const [row] = await db
    .delete(haircutServices)
    .where(eq(haircutServices.id, id))
    .returning({ id: haircutServices.id });
  if (!row) throw notFound('Tipo de corte');
  return { ok: true };
});
