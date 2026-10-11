'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { QuoteStatusBadge } from '@/components/app/status-badge';
import { QUOTE_STATUS } from '@/config/options';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAppForm } from '@/lib/form';
import { addDaysISO, formatDate, formatMoney, todayISO } from '@/lib/format';
import { clientOptions, clientsQuery, whatsappLink } from '@/features/clients/api';
import { convertQuote, deleteQuote, quoteQuery, saveQuote, type QuoteDetail } from './api';
import { quoteSchema, quoteTotals, type QuoteInput } from './schema';

type ItemValues = {
  description: string;
  quantity: number | undefined;
  unitPrice: number | undefined;
};
const emptyItem = (): ItemValues => ({ description: '', quantity: 1, unitPrice: undefined });

export default function QuoteEditor({
  id,
  defaultClientId
}: {
  id: number | null;
  defaultClientId?: number;
}) {
  const { data, isLoading, error } = useQuery({ ...quoteQuery(id ?? 0), enabled: !!id });

  if (id && error) {
    return (
      <PageContainer pageTitle='Orçamento não encontrado'>
        <Button variant='outline' render={<Link href='/dashboard/orcamentos' />}>
          Voltar para orçamentos
        </Button>
      </PageContainer>
    );
  }
  if (id && (isLoading || !data)) {
    return (
      <PageContainer>
        <Skeleton className='mb-4 h-10 w-64' />
        <Skeleton className='h-80 w-full' />
      </PageContainer>
    );
  }
  return (
    <QuoteForm key={data?.id ?? 'novo'} quote={data ?? null} defaultClientId={defaultClientId} />
  );
}

function QuoteForm({
  quote,
  defaultClientId
}: {
  quote: QuoteDetail | null;
  defaultClientId?: number;
}) {
  const router = useRouter();
  const isEdit = !!quote;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: clients } = useQuery(clientsQuery());

  const save = useApiMutation(saveQuote, {
    success: isEdit ? 'Orçamento salvo' : 'Orçamento criado',
    onSuccess: (saved) => {
      if (!isEdit) router.replace(`/dashboard/orcamentos/${saved.id}`);
    }
  });
  const convert = useApiMutation(convertQuote, {
    success: 'Projeto criado a partir do orçamento',
    onSuccess: (project) => router.push(`/dashboard/projetos/${project.id}`)
  });
  const remove = useApiMutation(deleteQuote, {
    success: 'Orçamento excluído',
    onSuccess: () => router.replace('/dashboard/orcamentos')
  });

  const form = useAppForm({
    defaultValues: {
      title: quote?.title ?? '',
      clientId: String(quote?.clientId ?? defaultClientId ?? ''),
      status: quote?.status ?? 'rascunho',
      validUntil: quote?.validUntil ?? addDaysISO(todayISO(), 15),
      discount: quote?.discount ?? 0,
      notes: quote?.notes ?? '',
      items: quote?.items.length
        ? quote.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice
          }))
        : [emptyItem()]
    } as QuoteInput,
    validators: { onSubmit: quoteSchema },
    onSubmit: async ({ value }) => {
      await save.mutateAsync({ id: quote?.id, values: value });
    }
  });

  const client = clients?.find((c) => String(c.id) === String(form.state.values.clientId));
  const shareText = quote
    ? encodeURIComponent(
        `Olá${quote.client ? `, ${quote.client.name.split(' ')[0]}` : ''}! Segue o orçamento "${quote.title}": ${formatMoney(quote.total)}.` +
          (quote.validUntil ? ` Válido até ${formatDate(quote.validUntil)}.` : '')
      )
    : '';
  const whatsapp = whatsappLink(quote?.client?.phone ?? client?.phone);

  return (
    <PageContainer
      pageTitle={isEdit ? `Orçamento #${quote.id}` : 'Novo orçamento'}
      pageHeaderAction={
        isEdit && (
          <Button
            variant='outline'
            size='icon'
            onClick={() => setDeleteOpen(true)}
            aria-label='Excluir'
          >
            <Icons.trash />
          </Button>
        )
      }
    >
      {isEdit && (
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          <QuoteStatusBadge status={quote.status} />
          <Button
            variant='outline'
            render={<a href={`/imprimir/orcamento/${quote.id}`} target='_blank' rel='noopener' />}
          >
            <Icons.printer /> Imprimir / PDF
          </Button>
          {whatsapp && (
            <Button
              variant='outline'
              render={
                <a
                  href={`${whatsapp}?text=${shareText}`}
                  target='_blank'
                  rel='noopener noreferrer'
                />
              }
            >
              <Icons.whatsapp /> Enviar
            </Button>
          )}
          {quote.projectId ? (
            <Button
              variant='secondary'
              render={<Link href={`/dashboard/projetos/${quote.projectId}`} />}
            >
              <Icons.projects /> Ver projeto
            </Button>
          ) : (
            <LoadingButton loading={convert.isPending} onClick={() => convert.mutate(quote.id)}>
              <Icons.check /> Aprovar e virar projeto
            </LoadingButton>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className='grid gap-4 lg:grid-cols-3'
      >
        <div className='space-y-4 lg:col-span-2'>
          <Card>
            <CardContent>
              <FieldGroup>
                <form.AppField
                  name='title'
                  children={(field) => (
                    <field.TextField
                      label='Título'
                      required
                      placeholder='Ex.: Site institucional + SEO'
                    />
                  )}
                />
                <form.AppField
                  name='clientId'
                  children={(field) => (
                    <field.ComboboxField
                      label='Cliente'
                      options={clientOptions(clients)}
                      placeholder='Escolha o cliente'
                      searchPlaceholder='Buscar cliente...'
                      emptyMessage='Nenhum cliente'
                    />
                  )}
                />
                <div className='grid grid-cols-2 gap-4'>
                  <form.AppField
                    name='status'
                    children={(field) => (
                      <field.SelectField label='Status' options={[...QUOTE_STATUS]} />
                    )}
                  />
                  <form.AppField
                    name='validUntil'
                    children={(field) => <field.TextField label='Válido até' type='date' />}
                  />
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Itens</CardTitle>
            </CardHeader>
            <CardContent>
              <form.Field name='items' mode='array'>
                {(itemsField) => (
                  <div className='space-y-4'>
                    {itemsField.state.value.map((_, i) => (
                      <div key={i} className='space-y-3 rounded-lg border p-3'>
                        <div className='flex items-start gap-2'>
                          <div className='flex-1'>
                            <form.AppField
                              name={`items[${i}].description`}
                              children={(field) => (
                                <field.TextField
                                  label={`Item ${i + 1}`}
                                  placeholder='Ex.: Desenvolvimento do site (5 páginas)'
                                />
                              )}
                            />
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            className='mt-6'
                            disabled={itemsField.state.value.length === 1}
                            onClick={() => itemsField.removeValue(i)}
                            aria-label={`Remover item ${i + 1}`}
                          >
                            <Icons.trash />
                          </Button>
                        </div>
                        <div className='grid grid-cols-3 gap-2'>
                          <form.AppField
                            name={`items[${i}].quantity`}
                            children={(field) => (
                              <field.TextField
                                label='Qtd.'
                                type='number'
                                inputMode='decimal'
                                min={0}
                                step={0.5}
                              />
                            )}
                          />
                          <form.AppField
                            name={`items[${i}].unitPrice`}
                            children={(field) => (
                              <field.TextField
                                label='Preço (R$)'
                                type='number'
                                inputMode='decimal'
                                min={0}
                                step={0.01}
                              />
                            )}
                          />
                          <form.Subscribe selector={(s) => s.values.items[i]}>
                            {(item) => (
                              <div className='flex flex-col justify-end pb-2 text-right'>
                                <span className='text-muted-foreground text-xs'>Total</span>
                                <span className='font-medium tabular-nums'>
                                  {formatMoney(
                                    (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0)
                                  )}
                                </span>
                              </div>
                            )}
                          </form.Subscribe>
                        </div>
                      </div>
                    ))}
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full'
                      onClick={() => itemsField.pushValue(emptyItem() as never)}
                    >
                      <Icons.add /> Adicionar item
                    </Button>
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <form.AppField
                name='notes'
                children={(field) => (
                  <field.TextareaField
                    label='Observações / condições'
                    rows={4}
                    placeholder='Prazo de entrega, forma de pagamento, o que está incluso...'
                  />
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className='lg:col-span-1'>
          <Card className='lg:sticky lg:top-20'>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <form.AppField
                name='discount'
                children={(field) => (
                  <field.TextField
                    label='Desconto (R$)'
                    type='number'
                    inputMode='decimal'
                    min={0}
                    step={0.01}
                  />
                )}
              />
              <form.Subscribe selector={(s) => [s.values.items, s.values.discount] as const}>
                {([items, discount]) => {
                  const { subtotal, total } = quoteTotals(
                    items.map((i) => ({
                      quantity: Number(i.quantity) || 0,
                      unitPrice: Number(i.unitPrice) || 0
                    })),
                    Number(discount) || 0
                  );
                  return (
                    <div className='space-y-1 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Subtotal</span>
                        <span className='tabular-nums'>{formatMoney(subtotal)}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Desconto</span>
                        <span className='tabular-nums'>− {formatMoney(Number(discount) || 0)}</span>
                      </div>
                      <Separator className='my-2' />
                      <div className='flex justify-between text-lg font-semibold'>
                        <span>Total</span>
                        <span className='text-primary tabular-nums'>{formatMoney(total)}</span>
                      </div>
                    </div>
                  );
                }}
              </form.Subscribe>
              <form.Subscribe selector={(s) => s.errors}>
                {(errors) =>
                  errors.length > 0 && (
                    <p className='text-destructive text-sm'>Confira os campos destacados.</p>
                  )
                }
              </form.Subscribe>
              <LoadingButton type='submit' loading={save.isPending} className='w-full' size='lg'>
                {isEdit ? 'Salvar alterações' : 'Criar orçamento'}
              </LoadingButton>
            </CardContent>
          </Card>
        </div>
      </form>

      {isEdit && (
        <AlertModal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => remove.mutate(quote.id)}
          loading={remove.isPending}
          title='Excluir orçamento?'
        />
      )}
    </PageContainer>
  );
}
