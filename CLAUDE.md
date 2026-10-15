# Notas para agentes

- UI e textos em **pt-BR**; dinheiro com `formatMoney`, datas com `formatDate` (`src/lib/format.ts`).
  Datas de calendário são strings `YYYY-MM-DD` (coluna `date` mode string) — nunca `new Date('YYYY-MM-DD')` direto; use `toDate`.
- Cada módulo vive em `src/features/<modulo>/`: `schema.ts` (Zod, compartilhado front/API), `api.ts`
  (queryOptions + funções de fetch), componentes. Páginas em `src/app/dashboard/**` só montam o componente.
- Backend: API routes em `src/app/api/**` sempre embrulhadas em `handler()` (`src/lib/api-handler.ts`),
  que exige sessão e converte Zod/FK em 400/409. Corpo validado com `parseBody(req, schema)`.
- Mutations no front usam `useApiMutation` (toast + invalida todas as queries).
- Listas usam `DataList` (tabela no desktop, cards no celular); formulários usam `FormSheet`
  (drawer de baixo no celular). Evite overflow horizontal: textos longos com `truncate` + `min-w-0`.
- Esquema do banco em `src/db/schema.ts`; após mudar, `npm run db:generate` e commitar a migração.
- Deploy: Railway (não Vercel) — `railway.json`; migrações rodam no `npm start` (`scripts/migrate.mjs`,
  sem dependências de dev — o Railway não instala devDependencies em produção).
