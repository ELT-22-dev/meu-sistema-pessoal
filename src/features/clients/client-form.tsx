'use client';

import { FieldGroup } from '@/components/ui/field';
import { FormSheet } from '@/components/app/form-sheet';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAppForm } from '@/lib/form';
import type { Client } from '@/db/schema';
import { saveClient } from './api';
import { clientSchema, type ClientInput } from './schema';

export function ClientFormSheet({
  client,
  open,
  onOpenChange,
  onSaved
}: {
  client?: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (client: Client) => void;
}) {
  const isEdit = !!client;
  const mutation = useApiMutation(saveClient, {
    success: isEdit ? 'Cliente atualizado' : 'Cliente cadastrado',
    onSuccess: (saved) => {
      onOpenChange(false);
      onSaved?.(saved);
    }
  });

  const form = useAppForm({
    defaultValues: {
      name: client?.name ?? '',
      company: client?.company ?? '',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      document: client?.document ?? '',
      notes: client?.notes ?? ''
    } as ClientInput,
    validators: { onSubmit: clientSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: client?.id, values: value });
      if (!isEdit) form.reset();
    }
  });

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar cliente' : 'Novo cliente'}
      formId='client-form'
      loading={mutation.isPending}
    >
      <form
        id='client-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='name'
            children={(field) => (
              <field.TextField label='Nome' required placeholder='Nome do cliente' />
            )}
          />
          <form.AppField
            name='company'
            children={(field) => <field.TextField label='Empresa' placeholder='Opcional' />}
          />
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <form.AppField
              name='phone'
              children={(field) => (
                <field.TextField
                  label='WhatsApp / telefone'
                  type='tel'
                  inputMode='tel'
                  placeholder='(11) 99999-9999'
                />
              )}
            />
            <form.AppField
              name='email'
              children={(field) => (
                <field.TextField label='E-mail' type='email' inputMode='email' />
              )}
            />
          </div>
          <form.AppField
            name='document'
            children={(field) => <field.TextField label='CPF / CNPJ' inputMode='numeric' />}
          />
          <form.AppField
            name='notes'
            children={(field) => <field.TextareaField label='Observações' rows={3} />}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}
