'use client';

import { FieldGroup } from '@/components/ui/field';
import { FormSheet } from '@/components/app/form-sheet';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAppForm } from '@/lib/form';
import { currentMonth, formatMonth, shiftMonth, todayISO } from '@/lib/format';
import type { SewingModel, SewingPayment, SewingWorker } from '@/db/schema';
import {
  saveSewingEntry,
  saveSewingModel,
  saveSewingPayment,
  saveSewingWorker,
  type SewingEntryRow,
  type SewingModelRow,
  type SewingWorkerRow
} from './api';
import {
  sewingEntrySchema,
  sewingModelSchema,
  sewingPaymentSchema,
  sewingWorkerSchema,
  SEWING_PAYMENT_KINDS,
  SEWING_ROLES,
  type SewingEntryInput,
  type SewingPaymentKind,
  type SewingModelInput,
  type SewingPaymentInput,
  type SewingWorkerInput
} from './schema';

type SheetProps = { open: boolean; onOpenChange: (open: boolean) => void };

// ---------------- Modelo de peça ----------------

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
      title={isEdit ? 'Editar modelo' : 'Novo modelo de peça'}
      description='Preço padrão por peça. Dá para ajustar em cada lançamento; mudar aqui não altera lançamentos antigos.'
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
              <field.TextField label='Modelo' required placeholder='Ex.: Calça, Short, Camisa' />
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
  workers,
  open,
  onOpenChange
}: SheetProps & {
  entry?: SewingEntryRow | null;
  models: SewingModelRow[];
  workers: SewingWorkerRow[];
}) {
  const isEdit = !!entry;
  const mutation = useApiMutation(saveSewingEntry, {
    success: isEdit ? 'Lançamento atualizado' : 'Produção lançada',
    onSuccess: () => onOpenChange(false)
  });
  const form = useAppForm({
    defaultValues: {
      date: entry?.date ?? todayISO(),
      workerId: String(entry?.workerId ?? ''),
      modelId: String(entry?.modelId ?? models.find((m) => m.active)?.id ?? ''),
      quantity: entry?.quantity ?? undefined,
      unitPrice: entry?.unitPrice ?? undefined,
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
  const workerOptions = [
    { value: '', label: 'Eu' },
    ...workers
      .filter((w) => w.active || w.id === entry?.workerId)
      .map((w) => ({ value: String(w.id), label: w.name }))
  ];

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
          <div className='grid grid-cols-2 gap-4'>
            <form.AppField
              name='workerId'
              children={(field) => (
                <field.SelectField label='Quem costurou' options={workerOptions} />
              )}
            />
            <form.AppField
              name='modelId'
              children={(field) => <field.SelectField label='Modelo' required options={options} />}
            />
          </div>
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
              name='unitPrice'
              children={(field) => (
                <field.TextField
                  label='Preço/peça (R$)'
                  type='number'
                  inputMode='decimal'
                  min={0}
                  step={0.01}
                />
              )}
            />
          </div>
          <form.AppField
            name='date'
            children={(field) => <field.TextField label='Dia' required type='date' />}
          />
          <form.AppField
            name='notes'
            children={(field) => <field.TextField label='Observação' placeholder='Opcional' />}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}

// ---------------- Pagamento / adiantamento / vale da oficina ----------------

/** Últimos 12 meses + o próximo (e o mês já gravado, se estiver fora disso). */
function monthOptions(selected?: string) {
  const now = currentMonth();
  const list = Array.from({ length: 14 }, (_, i) => shiftMonth(now, 1 - i));
  if (selected && !list.includes(selected)) list.push(selected);
  return list.sort((x, y) => y.localeCompare(x)).map((m) => ({ value: m, label: formatMonth(m) }));
}

export type PaymentFormValues = Pick<
  SewingPayment,
  'id' | 'kind' | 'month' | 'date' | 'amount' | 'notes'
>;

export function SewingPaymentSheet({
  payment,
  month,
  kind,
  amount,
  open,
  onOpenChange
}: SheetProps & {
  payment?: PaymentFormValues | null;
  /** Mês já escolhido (ao abrir pelo quadro do mês). */
  month?: string;
  kind?: SewingPaymentKind;
  /** Valor sugerido (ex.: o saldo do mês). */
  amount?: number;
}) {
  const isEdit = !!payment;
  const mutation = useApiMutation(saveSewingPayment, {
    success: isEdit ? 'Anotação atualizada' : 'Anotado no mês',
    onSuccess: () => onOpenChange(false)
  });
  const form = useAppForm({
    defaultValues: {
      kind: (payment?.kind as SewingPaymentKind) ?? kind ?? 'pagamento',
      month: payment?.month ?? month ?? currentMonth(),
      date: payment?.date ?? todayISO(),
      amount: payment?.amount ?? (amount && amount > 0 ? amount : undefined),
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
      title={isEdit ? 'Editar anotação' : 'Anotar recebimento da oficina'}
      description='Pagamento, adiantamento ou vale: abate do saldo do mês escolhido (o que sobrar passa para o mês seguinte) e entra como receita da Costura no financeiro.'
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
              name='kind'
              children={(field) => (
                <field.SelectField label='Tipo' required options={[...SEWING_PAYMENT_KINDS]} />
              )}
            />
            <form.AppField
              name='month'
              children={(field) => (
                <field.SelectField
                  label='Mês da produção'
                  required
                  options={monthOptions(payment?.month ?? month)}
                />
              )}
            />
          </div>
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
              name='date'
              children={(field) => <field.TextField label='Recebido em' required type='date' />}
            />
          </div>
          <form.AppField
            name='notes'
            children={(field) => (
              <field.TextField label='Observação' placeholder='Ex.: Pix, dinheiro...' />
            )}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}

// ---------------- Pessoa da equipe ----------------

export function SewingWorkerSheet({
  worker,
  open,
  onOpenChange
}: SheetProps & { worker?: SewingWorker | null }) {
  const isEdit = !!worker;
  const mutation = useApiMutation(saveSewingWorker, {
    success: isEdit ? 'Cadastro atualizado' : 'Pessoa adicionada à equipe',
    onSuccess: () => onOpenChange(false)
  });
  const form = useAppForm({
    defaultValues: {
      name: worker?.name ?? '',
      role: worker?.role ?? 'reta',
      active: worker?.active ?? true,
      notes: worker?.notes ?? ''
    } as SewingWorkerInput,
    validators: { onSubmit: sewingWorkerSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: worker?.id, values: value });
      if (!isEdit) form.reset();
    }
  });

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar pessoa' : 'Nova pessoa na equipe'}
      description='A oficina paga a equipe — aqui fica só o registro da produção de cada um.'
      formId='sewing-worker-form'
      loading={mutation.isPending}
    >
      <form
        id='sewing-worker-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='name'
            children={(field) => <field.TextField label='Nome' required placeholder='Ex.: Maria' />}
          />
          <form.AppField
            name='role'
            children={(field) => (
              <field.SelectField label='Máquina / função' options={[...SEWING_ROLES]} />
            )}
          />
          <form.AppField
            name='active'
            children={(field) => (
              <field.SwitchField
                label='Ativo'
                description='Quem saiu da oficina pode ser desativado sem perder o histórico.'
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
