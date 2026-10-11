'use client';

import { useQuery } from '@tanstack/react-query';
import { FieldGroup } from '@/components/ui/field';
import { FormSheet } from '@/components/app/form-sheet';
import { PROJECT_STATUS, PROJECT_TYPES } from '@/config/options';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAppForm } from '@/lib/form';
import { todayISO } from '@/lib/format';
import type { Project } from '@/db/schema';
import { clientOptions, clientsQuery } from '@/features/clients/api';
import { saveProject } from './api';
import { projectSchema, type ProjectInput } from './schema';

export function ProjectFormSheet({
  project,
  open,
  onOpenChange,
  defaultClientId,
  onSaved
}: {
  project?: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: number;
  onSaved?: (project: Project) => void;
}) {
  const isEdit = !!project;
  const { data: clients } = useQuery({ ...clientsQuery(), enabled: open });

  const mutation = useApiMutation(saveProject, {
    success: isEdit ? 'Projeto atualizado' : 'Projeto criado',
    onSuccess: (saved) => {
      onOpenChange(false);
      onSaved?.(saved);
    }
  });

  const form = useAppForm({
    defaultValues: {
      title: project?.title ?? '',
      clientId: String(project?.clientId ?? defaultClientId ?? ''),
      type: project?.type ?? 'site',
      status: project?.status ?? 'andamento',
      value: project?.value ?? undefined,
      startDate: project?.startDate ?? todayISO(),
      dueDate: project?.dueDate ?? '',
      url: project?.url ?? '',
      description: project?.description ?? ''
    } as ProjectInput,
    validators: { onSubmit: projectSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: project?.id, values: value });
      if (!isEdit) form.reset();
    }
  });

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar projeto' : 'Novo projeto'}
      formId='project-form'
      loading={mutation.isPending}
    >
      <form
        id='project-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='title'
            children={(field) => (
              <field.TextField label='Título' required placeholder='Ex.: Site da clínica' />
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
              name='type'
              children={(field) => (
                <field.SelectField label='Tipo' required options={[...PROJECT_TYPES]} />
              )}
            />
            <form.AppField
              name='status'
              children={(field) => (
                <field.SelectField label='Status' required options={[...PROJECT_STATUS]} />
              )}
            />
          </div>
          <form.AppField
            name='value'
            children={(field) => (
              <field.TextField
                label='Valor do projeto (R$)'
                required
                type='number'
                inputMode='decimal'
                min={0}
                step={0.01}
                placeholder='0,00'
              />
            )}
          />
          <div className='grid grid-cols-2 gap-4'>
            <form.AppField
              name='startDate'
              children={(field) => <field.TextField label='Início' type='date' />}
            />
            <form.AppField
              name='dueDate'
              children={(field) => <field.TextField label='Prazo' type='date' />}
            />
          </div>
          <form.AppField
            name='url'
            children={(field) => (
              <field.TextField
                label='Link (site / repositório)'
                type='url'
                placeholder='https://'
              />
            )}
          />
          <form.AppField
            name='description'
            children={(field) => <field.TextareaField label='Descrição / escopo' rows={4} />}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}
