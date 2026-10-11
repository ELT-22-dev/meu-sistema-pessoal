import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp
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

/** Modelo/operação que a oficina paga por peça (ex.: "Camiseta — fechar lateral"). */
export const sewingModels = pgTable('sewing_models', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  pricePerPiece: money('price_per_piece').notNull(),
  active: boolean('active').notNull().default(true),
  notes: text('notes'),
  createdAt: createdAt()
});

/** Produção do dia: quantas peças de cada modelo. O preço é copiado do modelo no lançamento. */
export const sewingEntries = pgTable(
  'sewing_entries',
  {
    id: serial('id').primaryKey(),
    date: day('date').notNull(),
    modelId: integer('model_id')
      .notNull()
      .references(() => sewingModels.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitPrice: money('unit_price').notNull(),
    notes: text('notes'),
    createdAt: createdAt()
  },
  (t) => [index('sewing_entries_date_idx').on(t.date)]
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
// Financeiro (tudo junto: dev, costura, pessoal)
// ------------------------------------------------------------------

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
    createdAt: createdAt()
  },
  (t) => [
    index('transactions_date_idx').on(t.date),
    index('transactions_project_idx').on(t.projectId)
  ]
);

export type Client = typeof clients.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type SewingModel = typeof sewingModels.$inferSelect;
export type SewingEntry = typeof sewingEntries.$inferSelect;
export type SewingPayment = typeof sewingPayments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
