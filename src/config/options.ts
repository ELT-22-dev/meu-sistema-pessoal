// Listas de opções do domínio (usadas no front e validadas na API).

type Option<T extends string = string> = { value: T; label: string };

const values = <T extends string>(opts: readonly Option<T>[]) =>
  opts.map((o) => o.value) as unknown as readonly [T, ...T[]];

export const labelOf = (opts: readonly Option[], value: string | null | undefined) =>
  opts.find((o) => o.value === value)?.label ?? value ?? '';

// ---------------- Projetos ----------------
export const PROJECT_TYPES = [
  { value: 'site', label: 'Site' },
  { value: 'landing', label: 'Landing page' },
  { value: 'sistema', label: 'Sistema' },
  { value: 'automacao', label: 'Automação' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'outro', label: 'Outro' }
] as const satisfies readonly Option[];
export const PROJECT_TYPE_VALUES = values(PROJECT_TYPES);

export const PROJECT_STATUS = [
  { value: 'lead', label: 'Negociando' },
  { value: 'andamento', label: 'Em andamento' },
  { value: 'revisao', label: 'Em revisão' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'cancelado', label: 'Cancelado' }
] as const satisfies readonly Option[];
export const PROJECT_STATUS_VALUES = values(PROJECT_STATUS);

/** Status que contam como "ativos" (trabalho em curso). */
export const ACTIVE_PROJECT_STATUS = ['andamento', 'revisao'] as const;
/** Status cujo valor já é devido pelo cliente (conta em "a receber"). */
export const BILLABLE_PROJECT_STATUS = ['andamento', 'revisao', 'concluido'] as const;

// ---------------- Orçamentos ----------------
export const QUOTE_STATUS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'recusado', label: 'Recusado' }
] as const satisfies readonly Option[];
export const QUOTE_STATUS_VALUES = values(QUOTE_STATUS);

// ---------------- Financeiro ----------------
export const TX_TYPES = [
  { value: 'receita', label: 'Receita' },
  { value: 'despesa', label: 'Despesa' }
] as const satisfies readonly Option[];
export const TX_TYPE_VALUES = values(TX_TYPES);

export const TX_AREAS = [
  { value: 'dev', label: 'Sites e sistemas' },
  { value: 'costura', label: 'Costura' },
  { value: 'cabeleireiro', label: 'Cabeleireiro' },
  { value: 'pessoal', label: 'Pessoal' }
] as const satisfies readonly Option[];
export const TX_AREA_VALUES = values(TX_AREAS);

export const TX_STATUS = [
  { value: 'pago', label: 'Pago' },
  { value: 'pendente', label: 'Pendente' }
] as const satisfies readonly Option[];
export const TX_STATUS_VALUES = values(TX_STATUS);

export const INCOME_CATEGORIES = [
  'Projeto',
  'Mensalidade / manutenção',
  'Costura',
  'Cabeleireiro',
  'Venda',
  'Outro'
] as const;

export const EXPENSE_CATEGORIES = [
  'Ferramentas e software',
  'Hospedagem e domínio',
  'Material de costura',
  'Equipamento',
  'Transporte',
  'Alimentação',
  'Casa e contas',
  'Impostos e taxas',
  'Outro'
] as const;

export const categoryOptions = (type: string) =>
  (type === 'despesa' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => ({
    value: c,
    label: c
  }));
