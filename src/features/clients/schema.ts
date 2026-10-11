import * as z from 'zod';
import { optText, reqText } from '@/lib/zod-helpers';

export const clientSchema = z.object({
  name: reqText('Nome'),
  company: optText(200),
  email: z
    .union([z.email('E-mail inválido'), z.literal('')])
    .nullish()
    .transform((v) => v || null),
  phone: optText(40),
  document: optText(40),
  notes: optText()
});

export type ClientInput = z.input<typeof clientSchema>;
