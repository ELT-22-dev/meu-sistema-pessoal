const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const int = new Intl.NumberFormat('pt-BR');

export function formatMoney(value: number | string | null | undefined) {
  return brl.format(Number(value ?? 0));
}

export function formatNumber(value: number | null | undefined) {
  return int.format(Number(value ?? 0));
}

/** Converte 'YYYY-MM-DD' (ou Date) em data local sem deslocamento de fuso. */
export function toDate(value: string | Date) {
  if (value instanceof Date) return value;
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(
  date: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }
) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', opts).format(toDate(date));
  } catch {
    return '';
  }
}

/** Data em 'YYYY-MM-DD' (fuso local). */
export function todayISO(base = new Date()) {
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(iso: string, days: number) {
  const d = toDate(iso);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

/** Mês em 'YYYY-MM'. */
export function currentMonth(base = new Date()) {
  return todayISO(base).slice(0, 7);
}

/** Primeiro e último dia de um mês 'YYYY-MM'. */
export function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  return currentMonth(new Date(y, m - 1 + delta, 1));
}

export function formatMonth(month: string, style: 'long' | 'short' = 'long') {
  const [y, m] = month.split('-').map(Number);
  const opts: Intl.DateTimeFormatOptions =
    style === 'long' ? { month: 'long', year: 'numeric' } : { month: 'short' };
  const label = new Intl.DateTimeFormat('pt-BR', opts)
    .format(new Date(y, m - 1, 1))
    .replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Dias até a data (negativo = atrasado). */
export function daysUntil(iso: string) {
  const today = toDate(todayISO());
  return Math.round((toDate(iso).getTime() - today.getTime()) / 86_400_000);
}

/** Segunda-feira da semana da data. */
export function weekStartISO(iso: string) {
  const d = toDate(iso);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return todayISO(d);
}
