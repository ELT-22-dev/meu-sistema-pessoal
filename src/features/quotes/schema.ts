import * as z from 'zod';
import { QUOTE_STATUS_VALUES } from '@/config/options';
import { money, optDate, optId, optText, reqText } from '@/lib/zod-helpers';

export const quoteItemSchema = z.object({
  description: reqText('Descrição do item', 500),
  quantity: z.number({ error: 'Qtd.' }).positive('Qtd. deve ser maior que zero'),
  unitPrice: money('Preço')
});

export const quoteSchema = z.object({
  title: reqText('Título'),
  clientId: optId,
  status: z.enum(QUOTE_STATUS_VALUES),
  validUntil: optDate,
  discount: money('Desconto'),
  notes: optText(5000),
  items: z.array(quoteItemSchema).min(1, 'Adicione pelo menos um item')
});

export type QuoteInput = z.input<typeof quoteSchema>;

export function quoteTotals(items: { quantity: number; unitPrice: number }[], discount: number) {
  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  return { subtotal: round2(subtotal), total: round2(total) };
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
