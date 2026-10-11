'use client';

import { FieldGroup } from '@/components/ui/field';
import { FormSheet } from '@/components/app/form-sheet';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAppForm } from '@/lib/form';
import { addDaysISO, todayISO } from '@/lib/format';
import type { SewingModel, SewingPayment } from '@/db/schema';
import {
  saveSewingEntry,
  saveSewingModel,
  saveSewingPayment,
  type SewingEntryRow,
  type SewingModelRow
} from './api';
import {
  sewingEntrySchema,
  sewingModelSchema,
  sewingPaymentSchema,
  type SewingEntryInput,
  type SewingModelInput,
  type SewingPaymentInput
} from './schema';

type SheetProps = { open: boolean; onOpenChange: (open: boolean) => void };

// ---------------- Modelo / operação ----------------

export function SewingModelSheet({
  model,
  open,
  onOpenChange
}: SheetProps & { model?: SewingModel | null }) {
  const isEdit = !!model;
  const mutation = useApiMutation(saveSewingModel, {
    success: isEdit ? 'Modelo atualizado' : 'Modelo cadastrado',
    onSuccess: () => onOpenChange(false)
  });
  const form = useAppForm({
    defaultValues: {
      name: model?.name ?? '',
      pricePerPiece: model?.pricePerPiece ?? undefined,
      active: model?.active ?? true,
      notes: model?.notes ?? ''
    } as SewingModelInput,
    validators: { onSubmit: sewingModelSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: model?.id, values: value });
      if (!isEdit) form.reset();
    }
  });

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar modelo' : 'Novo modelo / operação'}
      description='O que a oficina paga por peça. Mudar o preço não altera lançamentos antigos.'
      formId='sewing-model-form'
      loading={mutation.isPending}
    >
      <form
        id='sewing-model-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='name'
            children={(field) => (
              <field.TextField label='Nome' required placeholder='Ex.: Camiseta — fechar lateral' />
            )}
          />
          <form.AppField
            name='pricePerPiece'
            children={(field) => (
              <field.TextField
                label='Preço por peça (R$)'
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
            name='active'
            children={(field) => (
              <field.SwitchField
                label='Ativo'
                description='Modelos inativos somem do lançamento rápido.'
              />
            )}
          />
          <form.AppField
            name='notes'
            children={(field) => <field.TextareaField label='Observações' rows={2} />}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}

// ---------------- Lançamento de produção ----------------

export function SewingEntrySheet({
  entry,
  models,
  open,
  onOpenChange
}: SheetProps & { entry?: SewingEntryRow | null; models: SewingModelRow[] }) {
  const isEdit = !!entry;
  const mutation = useApiMutation(saveSewingEntry, {
    success: isEdit ? 'Lançamento atualizado' : 'Produção lançada',
    onSuccess: () => onOpenChange(false)
  });
  const form = useAppForm({
    defaultValues: {
      date: entry?.date ?? todayISO(),
      modelId: String(entry?.modelId ?? models.find((m) => m.active)?.id ?? ''),
      quantity: entry?.quantity ?? undefined,
      notes: entry?.notes ?? ''
    } as SewingEntryInput,
    validators: { onSubmit: sewingEntrySchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: entry?.id, values: value });
    }
  });

  const options = models
    .filter((m) => m.active || m.id === entry?.modelId)
    .map((m) => ({ value: String(m.id), label: m.name }));

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar produção' : 'Lançar produção'}
      formId='sewing-entry-form'
      loading={mutation.isPending}
    >
      <form
        id='sewing-entry-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='modelId'
            children={(field) => (
              <field.SelectField label='Modelo / operação' required options={options} />
            )}
          />
          <div className='grid grid-cols-2 gap-4'>
            <form.AppField
              name='quantity'
              children={(field) => (
                <field.TextField
                  label='Peças'
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
          <form.AppField
            name='notes'
            children={(field) => <field.TextField label='Observação' placeholder='Opcional' />}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}

// ---------------- Pagamento da oficina ----------------

export function SewingPaymentSheet({
  payment,
  balance,
  lastPaymentDate,
  open,
  onOpenChange
}: SheetProps & {
  payment?: SewingPayment | null;
  balance: number;
  lastPaymentDate?: string | null;
}) {
  const isEdit = !!payment;
  const mutation = useApiMutation(saveSewingPayment, {
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
    } as SewingPaymentInput,
    validators: { onSubmit: sewingPaymentSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: payment?.id, values: value });
    }
  });

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar pagamento' : 'Pagamento da oficina'}
      description='Entra como receita da Costura no financeiro e abate do saldo a receber.'
      formId='sewing-payment-form'
      loading={mutation.isPending}
    >
      <form
        id='sewing-payment-form'
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
            children={(field) => (
              <field.TextField label='Observação' placeholder='Ex.: Pix, vale descontado...' />
            )}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}
