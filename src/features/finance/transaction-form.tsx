'use client';

import { useQuery } from '@tanstack/react-query';
import { FieldGroup, FieldLabel, Field } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FormSheet } from '@/components/app/form-sheet';
import { TX_AREAS, TX_STATUS, categoryOptions } from '@/config/options';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAppForm } from '@/lib/form';
import { todayISO } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/db/schema';
import { clientOptions, clientsQuery } from '@/features/clients/api';
import { projectsQuery } from '@/features/projects/api';
import { saveTransaction } from './api';
import { transactionSchema, type TransactionInput } from './schema';

export function TransactionFormSheet({
  transaction,
  defaultType = 'despesa',
  open,
  onOpenChange
}: {
  transaction?: Transaction | null;
  defaultType?: 'receita' | 'despesa';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!transaction;
  const { data: clients } = useQuery({ ...clientsQuery(), enabled: open });
  const { data: projects } = useQuery({ ...projectsQuery(), enabled: open });

  const mutation = useApiMutation(saveTransaction, {
    success: isEdit ? 'Lançamento atualizado' : 'Lançamento salvo',
    onSuccess: () => onOpenChange(false)
  });

  const form = useAppForm({
    defaultValues: {
      type: transaction?.type ?? defaultType,
      area: transaction?.area ?? (defaultType === 'receita' ? 'dev' : 'pessoal'),
      category: transaction?.category ?? '',
      description: transaction?.description ?? '',
      amount: transaction?.amount ?? undefined,
      date: transaction?.date ?? todayISO(),
      status: transaction?.status ?? 'pago',
      clientId: String(transaction?.clientId ?? ''),
      projectId: String(transaction?.projectId ?? '')
    } as TransactionInput,
    validators: { onSubmit: transactionSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: transaction?.id, values: value });
      if (!isEdit) form.reset();
    }
  });

  const projectOptions = [
    { value: '', label: 'Nenhum' },
    ...(projects ?? []).map((p) => ({
      value: String(p.id),
      label: p.clientName ? `${p.title} — ${p.clientName}` : p.title
    }))
  ];

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar lançamento' : 'Novo lançamento'}
      formId='transaction-form'
      loading={mutation.isPending}
    >
      <form
        id='transaction-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name='type'>
            {(field) => (
              <Field>
                <FieldLabel>Tipo</FieldLabel>
                <ToggleGroup
                  value={[field.state.value]}
                  onValueChange={(v) => {
                    const next = v[0] as TransactionInput['type'] | undefined;
                    if (!next) return;
                    field.handleChange(next);
                    form.setFieldValue('category', '');
                  }}
                  variant='outline'
                  className='grid w-full grid-cols-2'
                >
                  <ToggleGroupItem
                    value='receita'
                    className={cn(
                      'h-11',
                      field.state.value === 'receita' &&
                        'bg-primary/15! text-primary! border-primary/40'
                    )}
                  >
                    Receita
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value='despesa'
                    className={cn(
                      'h-11',
                      field.state.value === 'despesa' &&
                        'bg-destructive/15! text-destructive! border-destructive/40'
                    )}
                  >
                    Despesa
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>
            )}
          </form.Field>

          <form.AppField
            name='amount'
            children={(field) => (
              <field.TextField
                label='Valor (R$)'
                required
                type='number'
                inputMode='decimal'
                min={0}
                step={0.01}
                placeholder='0,00'
              />
            )}
          />
          <form.AppField
            name='description'
            children={(field) => (
              <field.TextField label='Descrição' required placeholder='Ex.: Hospedagem Hostinger' />
            )}
          />
          <div className='grid grid-cols-2 gap-4'>
            <form.Subscribe selector={(s) => s.values.type}>
              {(type) => (
                <form.AppField
                  name='category'
                  children={(field) => (
                    <field.SelectField
                      label='Categoria'
                      required
                      placeholder='Escolha'
                      options={categoryOptions(type)}
                    />
                  )}
                />
              )}
            </form.Subscribe>
            <form.AppField
              name='area'
              children={(field) => (
                <field.SelectField label='Área' required options={[...TX_AREAS]} />
              )}
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <form.AppField
              name='date'
              children={(field) => <field.TextField label='Data' required type='date' />}
            />
            <form.AppField
              name='status'
              children={(field) => <field.SelectField label='Situação' options={[...TX_STATUS]} />}
            />
          </div>
          <form.AppField
            name='clientId'
            children={(field) => (
              <field.ComboboxField
                label='Cliente (opcional)'
                options={clientOptions(clients)}
                placeholder='Nenhum'
                searchPlaceholder='Buscar cliente...'
              />
            )}
          />
          <form.AppField
            name='projectId'
            children={(field) => (
              <field.ComboboxField
                label='Projeto (opcional)'
                options={projectOptions}
                placeholder='Nenhum'
                searchPlaceholder='Buscar projeto...'
              />
            )}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}
