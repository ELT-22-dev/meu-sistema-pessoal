import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não definida');
  return postgres(url, { max: Number(process.env.DB_POOL_MAX ?? 10) });
}

// Um único pool por processo: sobrevive a hot reloads no dev e é compartilhado
// entre os bundles de rotas/páginas em produção.
const client = (globalForDb.pg ??= createClient());

export const db = drizzle(client, { schema });
export { schema };
