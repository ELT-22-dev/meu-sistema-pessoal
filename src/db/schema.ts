import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex
} from 'drizzle-orm/pg-core';

// Valores em R$ com 2 casas; `mode: 'number'` devolve number no JS.
const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: 'number' });
// Datas de calendário como 'YYYY-MM-DD' (sem fuso horário).
const day = (name: string) => date(name, { mode: 'string' });
const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();

// ------------------------------------------------------------------
// Clientes e projetos (sites, sistemas, automação)
// ------------------------------------------------------------------

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  document: text('document'),
  notes: text('notes'),
  createdAt: createdAt()
});

export const projects = pgTable(
  'projects',
  {
    id: serial('id').primaryKey(),
    clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    // site | landing | sistema | automacao | manutencao | outro
    type: text('type').notNull().default('site'),
    // lead | andamento | revisao | concluido | pausado | cancelado
    status: text('status').notNull().default('andamento'),
    value: money('value').notNull().default(0),
    startDate: day('start_date'),
    dueDate: day('due_date'),
    url: text('url'),
    description: text('description'),
    createdAt: createdAt()
  },
  (t) => [index('projects_client_idx').on(t.clientId), index('projects_status_idx').on(t.status)]
);

export const tasks = pgTable(
  'tasks',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    done: boolean('done').notNull().default(false),
    dueDate: day('due_date'),
    createdAt: createdAt()
  },
  (t) => [index('tasks_project_idx').on(t.projectId)]
);

// ------------------------------------------------------------------
// Orçamentos
// ------------------------------------------------------------------

export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  // rascunho | enviado | aprovado | recusado
  status: text('status').notNull().default('rascunho'),
  validUntil: day('valid_until'),
  discount: money('discount').notNull().default(0),
  notes: text('notes'),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
  createdAt: createdAt()
});

export const quoteItems = pgTable(
  'quote_items',
  {
    id: serial('id').primaryKey(),
    quoteId: integer('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 2, mode: 'number' }).notNull().default(1),
    unitPrice: money('unit_price').notNull().default(0),
    position: integer('position').notNull().default(0)
  },
  (t) => [index('quote_items_quote_idx').on(t.quoteId)]
);

// ------------------------------------------------------------------
// Costura por peça (oficina)
// ------------------------------------------------------------------

/** Modelo de peça (calça, short, camisa...) com o preço por peça. */
export const sewingModels = pgTable('sewing_models', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  pricePerPiece: money('price_per_piece').notNull(),
  active: boolean('active').notNull().default(true),
  notes: text('notes'),
  createdAt: createdAt()
});

/** Pessoas da equipe na oficina (ex.: retistas). A oficina paga elas — aqui só se registra a produção. */
export const sewingWorkers = pgTable('sewing_workers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  // reta | overlock | interlock | outro
  role: text('role').notNull().default('reta'),
  active: boolean('active').notNull().default(true),
  notes: text('notes'),
  createdAt: createdAt()
});

/**
 * Produção do dia: quem costurou, quantas peças e de qual modelo.
 * `workerId` nulo = a minha produção (é a que conta no "a receber da oficina").
 * O preço é gravado no lançamento (padrão vem do modelo).
 */
export const sewingEntries = pgTable(
  'sewing_entries',
  {
    id: serial('id').primaryKey(),
    date: day('date').notNull(),
    workerId: integer('worker_id').references(() => sewingWorkers.id, { onDelete: 'restrict' }),
    modelId: integer('model_id')
      .notNull()
      .references(() => sewingModels.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitPrice: money('unit_price').notNull(),
    notes: text('notes'),
    createdAt: createdAt()
  },
  (t) => [
    index('sewing_entries_date_idx').on(t.date),
    index('sewing_entries_worker_idx').on(t.workerId)
  ]
);

/** Pagamento recebido da oficina. Gera uma receita no financeiro. */
export const sewingPayments = pgTable('sewing_payments', {
  id: serial('id').primaryKey(),
  date: day('date').notNull(),
  amount: money('amount').notNull(),
  periodStart: day('period_start'),
  periodEnd: day('period_end'),
  notes: text('notes'),
  createdAt: createdAt()
});

// ------------------------------------------------------------------
// Cabeleireiro (sábados): recebo uma comissão (%) de cada corte
// ------------------------------------------------------------------

/** Tipo de corte com preço cobrado do cliente e a minha comissão (%). */
export const haircutServices = pgTable('haircut_services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  price: money('price').notNull(),
  commissionPct: numeric('commission_pct', { precision: 5, scale: 2, mode: 'number' })
    .notNull()
    .default(50),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt()
});

/** Cortes do dia. Preço e comissão são copiados do tipo no lançamento (editáveis). */
export const haircutEntries = pgTable(
  'haircut_entries',
  {
    id: serial('id').primaryKey(),
    date: day('date').notNull(),
    serviceId: integer('service_id')
      .notNull()
      .references(() => haircutServices.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitPrice: money('unit_price').notNull(),
    commissionPct: numeric('commission_pct', { precision: 5, scale: 2, mode: 'number' }).notNull(),
    notes: text('notes'),
    createdAt: createdAt()
  },
  (t) => [index('haircut_entries_date_idx').on(t.date)]
);

/** Pagamento recebido do salão. Gera uma receita no financeiro. */
export const haircutPayments = pgTable('haircut_payments', {
  id: serial('id').primaryKey(),
  date: day('date').notNull(),
  amount: money('amount').notNull(),
  periodStart: day('period_start'),
  periodEnd: day('period_end'),
  notes: text('notes'),
  createdAt: createdAt()
});

// ------------------------------------------------------------------
// Financeiro (tudo junto: dev, costura, cabeleireiro, pessoal)
// ------------------------------------------------------------------

/**
 * Cobrança recorrente (mensalidade). Gera uma receita pendente por mês no financeiro,
 * de `startMonth` em diante; `generatedUntil` marca o último mês já gerado, para que
 * excluir um lançamento não o faça voltar.
 */
export const recurringCharges = pgTable('recurring_charges', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  amount: money('amount').notNull(),
  // 1–31; em meses mais curtos cai no último dia
  dayOfMonth: integer('day_of_month').notNull(),
  // 'YYYY-MM'
  startMonth: text('start_month').notNull(),
  endMonth: text('end_month'),
  area: text('area').notNull().default('dev'),
  category: text('category').notNull().default('Mensalidade / manutenção'),
  active: boolean('active').notNull().default(true),
  generatedUntil: text('generated_until'),
  createdAt: createdAt()
});

export const transactions = pgTable(
  'transactions',
  {
    id: serial('id').primaryKey(),
    // receita | despesa
    type: text('type').notNull(),
    // dev | costura | pessoal
    area: text('area').notNull().default('dev'),
    category: text('category').notNull(),
    description: text('description').notNull(),
    amount: money('amount').notNull(),
    date: day('date').notNull(),
    // pago | pendente
    status: text('status').notNull().default('pago'),
    clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),
    projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
    sewingPaymentId: integer('sewing_payment_id').references(() => sewingPayments.id, {
      onDelete: 'cascade'
    }),
    haircutPaymentId: integer('haircut_payment_id').references(() => haircutPayments.id, {
      onDelete: 'cascade'
    }),
    recurringId: integer('recurring_id').references(() => recurringCharges.id, {
      onDelete: 'set null'
    }),
    // 'YYYY-MM' da mensalidade que gerou este lançamento
    recurringMonth: text('recurring_month'),
    createdAt: createdAt()
  },
  (t) => [
    index('transactions_date_idx').on(t.date),
    index('transactions_project_idx').on(t.projectId),
    uniqueIndex('transactions_recurring_month_idx').on(t.recurringId, t.recurringMonth)
  ]
);

export type Client = typeof clients.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type SewingModel = typeof sewingModels.$inferSelect;
export type SewingEntry = typeof sewingEntries.$inferSelect;
export type SewingWorker = typeof sewingWorkers.$inferSelect;
export type HaircutService = typeof haircutServices.$inferSelect;
export type HaircutEntry = typeof haircutEntries.$inferSelect;
export type HaircutPayment = typeof haircutPayments.$inferSelect;
export type RecurringCharge = typeof recurringCharges.$inferSelect;
export type SewingPayment = typeof sewingPayments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
