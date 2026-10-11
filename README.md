# LaFlow — meu sistema pessoal

Sistema de gestão do Edil Leon ([thelaflow.com](https://thelaflow.com)) para o trabalho com
**sites, sistemas e automações** e com **costura por peça** — tudo em um lugar, funcionando
no celular, tablet e desktop (dá para "Adicionar à tela inicial" e usar como app).

## Módulos

| Módulo | O que faz |
| --- | --- |
| **Início** | Recebido/gasto no mês, quanto falta receber (projetos + oficina), produção da costura, gráfico de 6 meses, prazos próximos |
| **Clientes** | Cadastro com WhatsApp/e-mail, histórico de projetos, orçamentos e pagamentos |
| **Projetos** | Status, prazo, valor, tarefas (checklist) e pagamentos recebidos — cada pagamento vira receita no financeiro |
| **Orçamentos** | Itens + desconto, impressão/PDF, envio por WhatsApp e "Aprovar e virar projeto" |
| **Costura** | Lançamento rápido da produção (pensado para o celular), modelos com preço por peça, saldo a receber da oficina, pagamentos da oficina (viram receita) |
| **Financeiro** | Receitas e despesas por mês, área (dev / costura / pessoal), pago/pendente |

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **shadcn/ui** (Base UI) + Tailwind CSS v4, tema "LaFlow" com as cores do site
- **API routes** em `src/app/api/*` (backend no mesmo projeto)
- **PostgreSQL** + Drizzle ORM (migrações em `drizzle/`)
- Login com JWT (jose) em cookie httpOnly — usuário único definido por variáveis de ambiente
- TanStack Query + TanStack Form + Zod (mesmos schemas validam no front e na API)

Base visual/estrutural: [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) (MIT).

## Rodar localmente

```bash
npm install
cp env.example.txt .env        # preencha ADMIN_EMAIL, ADMIN_PASSWORD e AUTH_SECRET
npm run db:local               # Postgres local sem Docker (PGlite) — deixe rodando
npm run db:migrate             # em outro terminal
npm run dev                    # http://localhost:3000
```

> O PGlite aceita uma conexão por vez: mantenha `DB_POOL_MAX=1` no `.env` local.

## Banco de dados

```bash
# depois de mudar src/db/schema.ts
npm run db:generate   # gera a migração SQL em drizzle/
npm run db:migrate    # aplica
npm run db:studio     # navegador visual do banco
```

## Deploy (Railway)

O `railway.json` já configura build, migração antes de cada deploy (`preDeployCommand`)
e healthcheck em `/api/health`.

1. No projeto do Railway: **+ New → Database → PostgreSQL**.
2. **+ New → GitHub Repo → meu-sistema-pessoal**.
3. Em **Variables** do serviço web:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `AUTH_SECRET`
   - `TZ` = `America/Sao_Paulo`
   - opcionais: `BUSINESS_*` (dados do orçamento impresso)
4. **Settings → Networking → Generate Domain** (ou conecte um subdomínio próprio).

Cada `git push` na `main` faz um novo deploy.
