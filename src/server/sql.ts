import 'server-only';
import { sql } from 'drizzle-orm';

// Subconsultas reaproveitadas pelas API routes.
// A tabela de fora é escrita qualificada ("projects"."id"): numa consulta de uma tabela só o
// Drizzle renderiza ${projects.id} como "id", que dentro da subconsulta vira o id da tabela de dentro.

/** Total já recebido (receitas pagas) de um projeto. */
export const projectReceived = sql<number>`(
  select coalesce(sum(t.amount), 0) from transactions t
  where t.project_id = "projects"."id" and t.type = 'receita' and t.status = 'pago'
)`.mapWith(Number);

/** Tarefas abertas / total de um projeto. */
export const projectOpenTasks = sql<number>`(
  select count(*) from tasks k where k.project_id = "projects"."id" and not k.done
)`.mapWith(Number);
export const projectTotalTasks = sql<number>`(
  select count(*) from tasks k where k.project_id = "projects"."id"
)`.mapWith(Number);

/** Total do orçamento (itens - desconto, nunca negativo). */
export const quoteTotal = sql<number>`greatest(0, (
  select coalesce(sum(qi.quantity * qi.unit_price), 0) from quote_items qi
  where qi.quote_id = "quotes"."id"
) - "quotes"."discount")`.mapWith(Number);

export const clientProjectCount = sql<number>`(
  select count(*) from projects p where p.client_id = "clients"."id"
)`.mapWith(Number);

export const clientReceived = sql<number>`(
  select coalesce(sum(t.amount), 0) from transactions t
  where t.client_id = "clients"."id" and t.type = 'receita' and t.status = 'pago'
)`.mapWith(Number);

export const like = (term: string) => `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
