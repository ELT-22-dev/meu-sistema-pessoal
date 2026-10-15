import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sewingModels, sewingWorkers } from '@/db/schema';
import { HttpError } from '@/lib/api-handler';

/** Confere modelo e pessoa; devolve o preço do modelo (padrão quando não vier preço). */
export async function checkEntryRefs(modelId: number, workerId: number | null) {
  const model = await db.query.sewingModels.findFirst({ where: eq(sewingModels.id, modelId) });
  if (!model) throw new HttpError(400, 'Modelo não encontrado');
  if (workerId) {
    const worker = await db.query.sewingWorkers.findFirst({
      where: eq(sewingWorkers.id, workerId)
    });
    if (!worker) throw new HttpError(400, 'Pessoa da equipe não encontrada');
  }
  return model.pricePerPiece;
}
