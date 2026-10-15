'use client';

import { useQuery } from '@tanstack/react-query';
import { FieldGroup } from '@/components/ui/field';
import { FormSheet } from '@/components/app/form-sheet';
import { TX_AREAS } from '@/config/options';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAppForm } from '@/lib/form';
import { currentMonth } from '@/lib/format';
import type { RecurringCharge } from '@/db/schema';
import { clientOptions, clientsQuery } from '@/features/clients/api';
import { projectsQuery } from '@/features/projects/api';
import { saveRecurring } from './api';
import { recurringSchema, type RecurringInput } from './schema';

export function RecurringFormSheet({
  charge,
  defaultClientId,
  open,
  onOpenChange
}: {
  charge?: RecurringCharge | null;
  defaultClientId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!charge;
  const { data: clients } = useQuery({ ...clientsQuery(), enabled: open });
  const { data: projects } = useQuery({ ...projectsQuery(), enabled: open });

  const mutation = useApiMutation(saveRecurring, {
    success: isEdit ? 'Mensalidade atualizada' : 'Mensalidade criada — cobranças lançadas',
    onSuccess: () => onOpenChange(false)
  });

  const form = useAppForm({
    defaultValues: {
      clientId: String(charge?.clientId ?? defaultClientId ?? ''),
      projectId: String(charge?.projectId ?? ''),
      description: charge?.description ?? '',
      amount: charge?.amount ?? undefined,
      dayOfMonth: charge?.dayOfMonth ?? undefined,
      startMonth: charge?.startMonth ?? currentMonth(),
      endMonth: charge?.endMonth ?? '',
      area: charge?.area ?? 'dev',
      category: charge?.category ?? 'Mensalidade / manutenção',
      active: charge?.active ?? true
    } as RecurringInput,
    validators: { onSubmit: recurringSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: charge?.id, values: value });
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
      title={isEdit ? 'Editar mensalidade' : 'Nova mensalidade'}
      description='O sistema lança a cobrança pendente todo mês, no dia escolhido.'
      formId='recurring-form'
      loading={mutation.isPending}
    >
      <form
        id='recurring-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='clientId'
            children={(field) => (
              <field.ComboboxField
                label='Cliente'
                options={clientOptions(clients)}
                placeholder='Escolha o cliente'
                searchPlaceholder='Buscar cliente...'
              />
            )}
          />
          <form.AppField
            name='description'
            children={(field) => (
              <field.TextField
                label='Descrição'
                required
                placeholder='Ex.: Mensalidade site veropizzas.com.br'
              />
            )}
          />
          <div className='grid grid-cols-2 gap-4'>
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
                />
              )}
            />
            <form.AppField
              name='dayOfMonth'
              children={(field) => (
                <field.TextField
                  label='Dia do vencimento'
                  required
                  type='number'
                  inputMode='numeric'
                  min={1}
                  max={31}
                  step={1}
                  description='Mês mais curto: último dia'
                />
              )}
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <form.AppField
              name='startMonth'
              children={(field) => (
                <field.TextField label='Primeira cobrança' required type='month' />
              )}
            />
            <form.AppField
              name='endMonth'
              children={(field) => <field.TextField label='Última (opcional)' type='month' />}
            />
          </div>
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
          <form.AppField
            name='area'
            children={(field) => <field.SelectField label='Área' options={[...TX_AREAS]} />}
          />
          <form.AppField
            name='active'
            children={(field) => (
              <field.SwitchField
                label='Ativa'
                description='Desativada, para de gerar cobranças novas.'
              />
            )}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}
