// Aplica as migrações SQL de ./drizzle (só as que faltam). Roda no `npm start`, antes do Next.
// Sem dotenv: em produção ele não é instalado; localmente usamos o loader nativo do Node.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

try {
  process.loadEnvFile('.env');
} catch {}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL não definida');
  process.exit(1);
}

const client = postgres(url, { max: 1, onnotice: () => {} });
await migrate(drizzle(client), { migrationsFolder: './drizzle' });
await client.end();
console.log('Migrações aplicadas.');
