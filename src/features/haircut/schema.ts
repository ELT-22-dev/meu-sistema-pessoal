import * as z from 'zod';
import { formatDate } from '@/lib/format';
import { optDate, optText, reqDate, reqText } from '@/lib/zod-helpers';

const pct = z
  .number({ error: 'Informe a porcentagem' })
  .min(0, 'Entre 0 e 100')
  .max(100, 'Entre 0 e 100');

export const haircutServiceSchema = z.object({
  name: reqText('Nome'),
  price: z.number({ error: 'Informe o preço' }).positive('Preço deve ser maior que zero'),
  commissionPct: pct,
  active: z.boolean().default(true)
});

export type HaircutServiceInput = z.input<typeof haircutServiceSchema>;

export const haircutEntrySchema = z.object({
  date: reqDate,
  serviceId: z.coerce.number({ error: 'Escolha o corte' }).int().positive('Escolha o corte'),
  quantity: z
    .number({ error: 'Informe a quantidade' })
    .int('Quantidade deve ser inteira')
    .positive('Quantidade deve ser maior que zero')
    .max(1000),
  // vazio = valores atuais do tipo de corte
  unitPrice: z.number().positive('Preço deve ser maior que zero').nullish(),
  commissionPct: pct.nullish(),
  notes: optText(500)
});

export type HaircutEntryInput = z.input<typeof haircutEntrySchema>;

export const haircutPaymentSchema = z.object({
  date: reqDate,
  amount: z.number({ error: 'Informe o valor' }).positive('Valor deve ser maior que zero'),
  periodStart: optDate,
  periodEnd: optDate,
  notes: optText(500)
});

export type HaircutPaymentInput = z.input<typeof haircutPaymentSchema>;

export function haircutPaymentDescription(p: {
  periodStart: string | null;
  periodEnd: string | null;
}) {
  if (p.periodStart && p.periodEnd) {
    return `Pagamento do salão (${formatDate(p.periodStart)} a ${formatDate(p.periodEnd)})`;
  }
  return 'Pagamento do salão';
}

/** Minha parte de um lançamento. */
export const myShare = (e: { quantity: number; unitPrice: number; commissionPct: number }) =>
  Math.round(e.quantity * e.unitPrice * e.commissionPct) / 100;
