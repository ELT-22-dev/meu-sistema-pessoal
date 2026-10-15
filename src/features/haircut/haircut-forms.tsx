'use client';

import { FieldGroup } from '@/components/ui/field';
import { FormSheet } from '@/components/app/form-sheet';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAppForm } from '@/lib/form';
import { addDaysISO, todayISO } from '@/lib/format';
import type { HaircutPayment, HaircutService } from '@/db/schema';
import {
  saveHaircutEntry,
  saveHaircutPayment,
  saveHaircutService,
  type HaircutEntryRow,
  type HaircutServiceRow
} from './api';
import {
  haircutEntrySchema,
  haircutPaymentSchema,
  haircutServiceSchema,
  type HaircutEntryInput,
  type HaircutPaymentInput,
  type HaircutServiceInput
} from './schema';

type SheetProps = { open: boolean; onOpenChange: (open: boolean) => void };

// ---------------- Tipo de corte ----------------

export function HaircutServiceSheet({
  service,
  open,
  onOpenChange
}: SheetProps & { service?: HaircutService | null }) {
  const isEdit = !!service;
  const mutation = useApiMutation(saveHaircutService, {
    success: isEdit ? 'Tipo de corte atualizado' : 'Tipo de corte criado',
    onSuccess: () => onOpenChange(false)
  });
  const form = useAppForm({
    defaultValues: {
      name: service?.name ?? '',
      price: service?.price ?? undefined,
      commissionPct: service?.commissionPct ?? 50,
      active: service?.active ?? true
    } as HaircutServiceInput,
    validators: { onSubmit: haircutServiceSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: service?.id, values: value });
      if (!isEdit) form.reset();
    }
  });

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar tipo de corte' : 'Novo tipo de corte'}
      description='Mudar preço ou comissão não altera cortes já lançados.'
      formId='haircut-service-form'
      loading={mutation.isPending}
    >
      <form
        id='haircut-service-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='name'
            children={(field) => (
              <field.TextField label='Nome' required placeholder='Ex.: Corte R$ 25' />
            )}
          />
          <div className='grid grid-cols-2 gap-4'>
            <form.AppField
              name='price'
              children={(field) => (
                <field.TextField
                  label='Preço do corte (R$)'
                  required
                  type='number'
                  inputMode='decimal'
                  min={0}
                  step={0.01}
                />
              )}
            />
            <form.AppField
              name='commissionPct'
              children={(field) => (
                <field.TextField
                  label='Minha parte (%)'
                  required
                  type='number'
                  inputMode='decimal'
                  min={0}
                  max={100}
                  step={1}
                />
              )}
            />
          </div>
          <form.AppField
            name='active'
            children={(field) => (
              <field.SwitchField label='Ativo' description='Inativos somem do lançamento rápido.' />
            )}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}

// ---------------- Lançamento ----------------

export function HaircutEntrySheet({
  entry,
  services,
  open,
  onOpenChange
}: SheetProps & { entry: HaircutEntryRow; services: HaircutServiceRow[] }) {
  const mutation = useApiMutation(saveHaircutEntry, {
    success: 'Lançamento atualizado',
    onSuccess: () => onOpenChange(false)
  });
  const form = useAppForm({
    defaultValues: {
      date: entry.date,
      serviceId: String(entry.serviceId),
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      commissionPct: entry.commissionPct,
      notes: entry.notes ?? ''
    } as HaircutEntryInput,
    validators: { onSubmit: haircutEntrySchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: entry.id, values: value });
    }
  });
  const options = services
    .filter((s) => s.active || s.id === entry.serviceId)
    .map((s) => ({ value: String(s.id), label: s.name }));

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title='Editar cortes'
      formId='haircut-entry-form'
      loading={mutation.isPending}
    >
      <form
        id='haircut-entry-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='serviceId'
            children={(field) => <field.SelectField label='Tipo de corte' options={options} />}
          />
          <div className='grid grid-cols-2 gap-4'>
            <form.AppField
              name='quantity'
              children={(field) => (
                <field.TextField
                  label='Quantidade'
                  required
                  type='number'
                  inputMode='numeric'
                  min={1}
                  step={1}
                />
              )}
            />
            <form.AppField
              name='date'
              children={(field) => <field.TextField label='Dia' required type='date' />}
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <form.AppField
              name='unitPrice'
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
            <form.AppField
              name='commissionPct'
              children={(field) => (
                <field.TextField
                  label='Minha parte (%)'
                  type='number'
                  inputMode='decimal'
                  min={0}
                  max={100}
                  step={1}
                />
              )}
            />
          </div>
          <form.AppField
            name='notes'
            children={(field) => <field.TextField label='Observação' placeholder='Opcional' />}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}

// ---------------- Pagamento do salão ----------------

export function HaircutPaymentSheet({
  payment,
  balance,
  lastPaymentDate,
  open,
  onOpenChange
}: SheetProps & {
  payment?: HaircutPayment | null;
  balance: number;
  lastPaymentDate?: string | null;
}) {
  const isEdit = !!payment;
  const mutation = useApiMutation(saveHaircutPayment, {
    success: isEdit ? 'Pagamento atualizado' : 'Pagamento registrado',
    onSuccess: () => onOpenChange(false)
  });
  const form = useAppForm({
    defaultValues: {
      date: payment?.date ?? todayISO(),
      amount: payment?.amount ?? (balance > 0 ? balance : undefined),
      periodStart: payment?.periodStart ?? (lastPaymentDate ? addDaysISO(lastPaymentDate, 1) : ''),
      periodEnd: payment?.periodEnd ?? (isEdit ? '' : todayISO()),
      notes: payment?.notes ?? ''
    } as HaircutPaymentInput,
    validators: { onSubmit: haircutPaymentSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: payment?.id, values: value });
    }
  });

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar pagamento' : 'Pagamento do salão'}
      description='Entra como receita do Cabeleireiro no financeiro e abate do saldo a receber.'
      formId='haircut-payment-form'
      loading={mutation.isPending}
    >
      <form
        id='haircut-payment-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <div className='grid grid-cols-2 gap-4'>
            <form.AppField
              name='amount'
              children={(field) => (
                <field.TextField
                  label='Valor recebido (R$)'
                  required
                  type='number'
                  inputMode='decimal'
                  min={0}
                  step={0.01}
                />
              )}
            />
            <form.AppField
              name='date'
              children={(field) => <field.TextField label='Recebido em' required type='date' />}
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <form.AppField
              name='periodStart'
              children={(field) => <field.TextField label='Referente de' type='date' />}
            />
            <form.AppField
              name='periodEnd'
              children={(field) => <field.TextField label='até' type='date' />}
            />
          </div>
          <form.AppField
            name='notes'
            children={(field) => <field.TextField label='Observação' placeholder='Ex.: Pix' />}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}
