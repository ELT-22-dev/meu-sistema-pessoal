import * as z from 'zod';
import { formatDate } from '@/lib/format';
import { optDate, optId, optText, reqDate, reqText } from '@/lib/zod-helpers';

export const SEWING_ROLES = [
  { value: 'reta', label: 'Reta' },
  { value: 'overlock', label: 'Overlock' },
  { value: 'interlock', label: 'Interlock' },
  { value: 'outro', label: 'Outro' }
] as const;

export const sewingWorkerSchema = z.object({
  name: reqText('Nome'),
  role: z.enum(['reta', 'overlock', 'interlock', 'outro']),
  active: z.boolean().default(true),
  notes: optText(500)
});

export type SewingWorkerInput = z.input<typeof sewingWorkerSchema>;

export const sewingModelSchema = z.object({
  name: reqText('Nome do modelo'),
  pricePerPiece: z
    .number({ error: 'Informe o preço por peça' })
    .positive('Preço deve ser maior que zero'),
  active: z.boolean().default(true),
  notes: optText(1000)
});

export type SewingModelInput = z.input<typeof sewingModelSchema>;

export const sewingEntrySchema = z.object({
  date: reqDate,
  // vazio = eu
  workerId: optId,
  modelId: z.coerce.number({ error: 'Escolha o modelo' }).int().positive('Escolha o modelo'),
  quantity: z
    .number({ error: 'Informe a quantidade' })
    .int('Quantidade deve ser inteira')
    .positive('Quantidade deve ser maior que zero')
    .max(100_000),
  // vazio = preço do modelo
  unitPrice: z.number().positive('Preço deve ser maior que zero').nullish(),
  notes: optText(500)
});

export type SewingEntryInput = z.input<typeof sewingEntrySchema>;

export const sewingPaymentSchema = z.object({
  date: reqDate,
  amount: z.number({ error: 'Informe o valor' }).positive('Valor deve ser maior que zero'),
  periodStart: optDate,
  periodEnd: optDate,
  notes: optText(500)
});

export type SewingPaymentInput = z.input<typeof sewingPaymentSchema>;

export function paymentDescription(p: { periodStart: string | null; periodEnd: string | null }) {
  if (p.periodStart && p.periodEnd) {
    return `Pagamento da oficina (${formatDate(p.periodStart)} a ${formatDate(p.periodEnd)})`;
  }
  return 'Pagamento da oficina';
}
