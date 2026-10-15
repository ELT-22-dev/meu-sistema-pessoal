import * as z from 'zod';
import { TX_AREA_VALUES } from '@/config/options';
import { optId, reqText } from '@/lib/zod-helpers';

const MONTH_RE = /^\d{4}-\d{2}$/;

export const recurringSchema = z
  .object({
    clientId: optId,
    projectId: optId,
    description: reqText('Descrição'),
    amount: z.number({ error: 'Informe o valor' }).positive('Valor deve ser maior que zero'),
    dayOfMonth: z
      .number({ error: 'Informe o dia' })
      .int('Dia inválido')
      .min(1, 'Dia entre 1 e 31')
      .max(31, 'Dia entre 1 e 31'),
    startMonth: z.string().regex(MONTH_RE, 'Informe o mês de início'),
    endMonth: z
      .union([z.string().regex(MONTH_RE, 'Mês inválido'), z.literal('')])
      .nullish()
      .transform((v) => v || null),
    area: z.enum(TX_AREA_VALUES).default('dev'),
    category: reqText('Categoria', 100).default('Mensalidade / manutenção'),
    active: z.boolean().default(true)
  })
  .refine((v) => !v.endMonth || v.endMonth >= v.startMonth, {
    message: 'O fim deve ser depois do início',
    path: ['endMonth']
  });

export type RecurringInput = z.input<typeof recurringSchema>;
