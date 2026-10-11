import { asc, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/db';
import { clients, quoteItems, quotes } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { formatDate, formatMoney } from '@/lib/format';
import { quoteTotals } from '@/features/quotes/schema';
import { PrintButton } from './print-button';

export const metadata: Metadata = { title: 'Orçamento' };

// Dados do emissor vêm das variáveis de ambiente (não ficam no código).
const business = {
  name: process.env.BUSINESS_NAME ?? process.env.ADMIN_NAME ?? 'LaFlow',
  role: process.env.BUSINESS_ROLE ?? 'Desenvolvimento de sites, sistemas e automações',
  email: process.env.BUSINESS_EMAIL,
  phone: process.env.BUSINESS_PHONE,
  site: process.env.BUSINESS_SITE ?? 'thelaflow.com',
  document: process.env.BUSINESS_DOCUMENT
};

export default async function PrintQuotePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) redirect('/login');
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, id) });
  if (!quote) notFound();
  const [items, client] = await Promise.all([
    db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, id))
      .orderBy(asc(quoteItems.position), asc(quoteItems.id)),
    quote.clientId ? db.query.clients.findFirst({ where: eq(clients.id, quote.clientId) }) : null
  ]);
  const { subtotal, total } = quoteTotals(items, quote.discount);

  return (
    <div className='min-h-dvh bg-neutral-100 py-6 text-neutral-900 print:bg-white print:py-0'>
      <div className='mx-auto mb-4 flex max-w-3xl justify-end px-4 print:hidden'>
        <PrintButton />
      </div>
      <article className='mx-auto max-w-3xl bg-white p-8 shadow-sm sm:p-12 print:max-w-none print:p-0 print:shadow-none'>
        <header className='flex flex-col justify-between gap-6 border-b-2 border-emerald-500 pb-6 sm:flex-row'>
          <div>
            <div className='text-2xl font-bold'>{business.name}</div>
            <div className='text-sm text-neutral-600'>{business.role}</div>
            <div className='mt-2 space-y-0.5 text-sm text-neutral-600'>
              {business.site && <div>{business.site}</div>}
              {business.email && <div>{business.email}</div>}
              {business.phone && <div>{business.phone}</div>}
              {business.document && <div>{business.document}</div>}
            </div>
          </div>
          <div className='sm:text-right'>
            <div className='text-sm font-semibold tracking-wider text-emerald-600 uppercase'>
              Orçamento
            </div>
            <div className='text-3xl font-bold'>#{quote.id}</div>
            <div className='mt-2 text-sm text-neutral-600'>
              Emitido em {formatDate(quote.createdAt)}
              {quote.validUntil && (
                <>
                  <br />
                  Válido até {formatDate(quote.validUntil)}
                </>
              )}
            </div>
          </div>
        </header>

        <section className='grid gap-6 py-6 sm:grid-cols-2'>
          <div>
            <div className='text-xs font-semibold tracking-wider text-neutral-500 uppercase'>
              Cliente
            </div>
            {client ? (
              <div className='mt-1 text-sm'>
                <div className='font-semibold'>{client.name}</div>
                {client.company && <div>{client.company}</div>}
                {client.document && <div>{client.document}</div>}
                {client.email && <div>{client.email}</div>}
                {client.phone && <div>{client.phone}</div>}
              </div>
            ) : (
              <div className='mt-1 text-sm text-neutral-500'>—</div>
            )}
          </div>
          <div>
            <div className='text-xs font-semibold tracking-wider text-neutral-500 uppercase'>
              Proposta
            </div>
            <div className='mt-1 text-lg font-semibold'>{quote.title}</div>
          </div>
        </section>

        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-neutral-300 text-left text-xs tracking-wider text-neutral-500 uppercase'>
              <th className='py-2 pr-2 font-semibold'>Descrição</th>
              <th className='px-2 py-2 text-right font-semibold'>Qtd.</th>
              <th className='px-2 py-2 text-right font-semibold'>Valor unit.</th>
              <th className='py-2 pl-2 text-right font-semibold'>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className='border-b border-neutral-200 align-top'>
                <td className='py-3 pr-2 whitespace-pre-line'>{item.description}</td>
                <td className='px-2 py-3 text-right tabular-nums'>
                  {item.quantity.toLocaleString('pt-BR')}
                </td>
                <td className='px-2 py-3 text-right tabular-nums'>{formatMoney(item.unitPrice)}</td>
                <td className='py-3 pl-2 text-right font-medium tabular-nums'>
                  {formatMoney(item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className='mt-4 ml-auto w-full max-w-xs space-y-1 text-sm'>
          <div className='flex justify-between'>
            <span className='text-neutral-600'>Subtotal</span>
            <span className='tabular-nums'>{formatMoney(subtotal)}</span>
          </div>
          {quote.discount > 0 && (
            <div className='flex justify-between'>
              <span className='text-neutral-600'>Desconto</span>
              <span className='tabular-nums'>− {formatMoney(quote.discount)}</span>
            </div>
          )}
          <div className='flex justify-between border-t-2 border-emerald-500 pt-2 text-lg font-bold'>
            <span>Total</span>
            <span className='tabular-nums'>{formatMoney(total)}</span>
          </div>
        </div>

        {quote.notes && (
          <section className='mt-8'>
            <div className='text-xs font-semibold tracking-wider text-neutral-500 uppercase'>
              Observações
            </div>
            <p className='mt-1 text-sm whitespace-pre-line'>{quote.notes}</p>
          </section>
        )}

        <footer className='mt-12 border-t border-neutral-200 pt-4 text-center text-xs text-neutral-500'>
          {business.name} · {business.site}
        </footer>
      </article>
    </div>
  );
}
