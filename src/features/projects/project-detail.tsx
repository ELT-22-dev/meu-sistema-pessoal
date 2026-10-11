'use client';

import { useState } from 'react';
import type * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { FieldGroup } from '@/components/ui/field';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { FormSheet } from '@/components/app/form-sheet';
import { StatCard } from '@/components/app/stat-card';
import { DueLabel } from '@/components/app/due-label';
import { ProjectTypeLabel } from '@/components/app/status-badge';
import { PROJECT_STATUS } from '@/config/options';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAppForm } from '@/lib/form';
import { formatDate, formatMoney, todayISO } from '@/lib/format';
import { cn } from '@/lib/utils';
import { whatsappLink } from '@/features/clients/api';
import {
  addProjectPayment,
  addTask,
  deleteProject,
  deleteTask,
  projectQuery,
  saveProject,
  updateTask,
  type ProjectDetail as ProjectDetailData
} from './api';
import { ProjectFormSheet } from './project-form';
import { projectPaymentSchema, type ProjectInput } from './schema';

export default function ProjectDetail({ id }: { id: number }) {
  const router = useRouter();
  const { data: project, isLoading, error } = useQuery(projectQuery(id));
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const remove = useApiMutation(deleteProject, {
    success: 'Projeto excluído',
    onSuccess: () => router.replace('/dashboard/projetos')
  });
  const changeStatus = useApiMutation(saveProject, { success: 'Status atualizado' });

  if (error) {
    return (
      <PageContainer pageTitle='Projeto não encontrado'>
        <Button variant='outline' render={<Link href='/dashboard/projetos' />}>
          Voltar para projetos
        </Button>
      </PageContainer>
    );
  }
  if (isLoading || !project) {
    return (
      <PageContainer>
        <Skeleton className='mb-4 h-10 w-64' />
        <Skeleton className='h-40 w-full' />
      </PageContainer>
    );
  }

  const remaining = Math.max(0, project.value - project.received);
  const pct = project.value > 0 ? Math.min(100, (project.received / project.value) * 100) : 0;
  const whatsapp = whatsappLink(project.client?.phone);

  return (
    <PageContainer
      pageTitle={project.title}
      pageHeaderAction={
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setEditOpen(true)}
            aria-label='Editar'
          >
            <Icons.edit />
          </Button>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setDeleteOpen(true)}
            aria-label='Excluir'
          >
            <Icons.trash />
          </Button>
        </div>
      }
    >
      <div className='space-y-4'>
        <div className='text-muted-foreground -mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm'>
          <ProjectTypeLabel type={project.type} />
          {project.client && (
            <Link
              href={`/dashboard/clientes/${project.client.id}`}
              className='hover:text-foreground underline-offset-4 hover:underline'
            >
              {project.client.name}
            </Link>
          )}
          {project.dueDate && (
            <span className='inline-flex items-center gap-1'>
              Prazo: <DueLabel date={project.dueDate} done={project.status === 'concluido'} />
            </span>
          )}
          <NativeSelect
            size='sm'
            aria-label='Status do projeto'
            value={project.status}
            disabled={changeStatus.isPending}
            onChange={(e) =>
              changeStatus.mutate({
                id: project.id,
                values: {
                  title: project.title,
                  clientId: project.clientId,
                  type: project.type as ProjectInput['type'],
                  status: e.target.value as ProjectInput['status'],
                  value: project.value,
                  startDate: project.startDate,
                  dueDate: project.dueDate,
                  url: project.url,
                  description: project.description
                }
              })
            }
          >
            {PROJECT_STATUS.map((s) => (
              <NativeSelectOption key={s.value} value={s.value}>
                {s.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button onClick={() => setPayOpen(true)}>
            <Icons.cash /> Registrar pagamento
          </Button>
          {whatsapp && (
            <Button
              variant='outline'
              render={<a href={whatsapp} target='_blank' rel='noopener noreferrer' />}
            >
              <Icons.whatsapp /> WhatsApp
            </Button>
          )}
          {project.url && (
            <Button
              variant='outline'
              render={<a href={project.url} target='_blank' rel='noopener noreferrer' />}
            >
              <Icons.externalLink /> Abrir link
            </Button>
          )}
        </div>

        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <StatCard label='Valor' value={formatMoney(project.value)} />
          <StatCard label='Recebido' value={formatMoney(project.received)} tone='positive' />
          <StatCard label='Falta receber' value={formatMoney(remaining)} tone='accent' />
          <StatCard
            label='Tarefas'
            value={`${project.tasks.filter((t) => t.done).length}/${project.tasks.length}`}
          />
        </div>
        <Progress value={pct} className='h-2' aria-label='Percentual recebido' />

        <div className='grid gap-4 lg:grid-cols-5'>
          <TasksCard project={project} />
          <div className='space-y-4 lg:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos</CardTitle>
              </CardHeader>
              <CardContent className='space-y-1'>
                {project.payments.length === 0 && (
                  <p className='text-muted-foreground text-sm'>Nada recebido ainda.</p>
                )}
                {project.payments.map((p) => (
                  <div key={p.id} className='flex items-center justify-between gap-2 py-1 text-sm'>
                    <div className='min-w-0'>
                      <div className='truncate'>{p.description}</div>
                      <div className='text-muted-foreground text-xs'>
                        {formatDate(p.date)}
                        {p.status === 'pendente' && ' · pendente'}
                      </div>
                    </div>
                    <span className='font-medium tabular-nums'>{formatMoney(p.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            {(project.description || project.startDate) && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2 text-sm'>
                  {project.startDate && (
                    <div className='text-muted-foreground'>
                      Início: {formatDate(project.startDate)}
                    </div>
                  )}
                  {project.description && (
                    <p className='whitespace-pre-line'>{project.description}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ProjectFormSheet project={project} open={editOpen} onOpenChange={setEditOpen} />
      <PaymentSheet
        key={remaining}
        projectId={project.id}
        remaining={remaining}
        open={payOpen}
        onOpenChange={setPayOpen}
      />
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => remove.mutate(project.id)}
        loading={remove.isPending}
        title='Excluir projeto?'
        description='As tarefas serão apagadas. Pagamentos continuam no financeiro.'
      />
    </PageContainer>
  );
}

function TasksCard({ project }: { project: ProjectDetailData }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const add = useApiMutation(addTask, {
    onSuccess: () => {
      setTitle('');
      setDueDate('');
    }
  });
  const toggle = useApiMutation(updateTask);
  const remove = useApiMutation(deleteTask);

  return (
    <Card className='lg:col-span-3'>
      <CardHeader>
        <CardTitle>Tarefas</CardTitle>
        <CardAction>
          <span className='text-muted-foreground text-xs'>
            {project.tasks.filter((t) => !t.done).length} abertas
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className='space-y-3'>
        <form
          className='flex flex-col gap-2 sm:flex-row'
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) add.mutate({ projectId: project.id, title, dueDate });
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Nova tarefa...'
            aria-label='Nova tarefa'
            className='flex-1'
          />
          <div className='flex gap-2'>
            <Input
              type='date'
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label='Prazo da tarefa'
              className='flex-1 sm:w-40'
            />
            <Button type='submit' disabled={!title.trim() || add.isPending}>
              <Icons.add /> Adicionar
            </Button>
          </div>
        </form>

        <ul className='divide-y'>
          {project.tasks.length === 0 && (
            <li className='text-muted-foreground py-2 text-sm'>Nenhuma tarefa.</li>
          )}
          {project.tasks.map((t) => (
            <li key={t.id} className='group flex items-center gap-3 py-2'>
              <Checkbox
                checked={t.done}
                onCheckedChange={(done) => toggle.mutate({ id: t.id, done: !!done })}
                aria-label={`Concluir ${t.title}`}
                className='size-5'
              />
              <span
                className={cn('flex-1 text-sm', t.done && 'text-muted-foreground line-through')}
              >
                {t.title}
              </span>
              {t.dueDate && <DueLabel date={t.dueDate} done={t.done} />}
              <Button
                variant='ghost'
                size='icon-sm'
                className='opacity-60 group-hover:opacity-100'
                onClick={() => remove.mutate(t.id)}
                aria-label={`Excluir ${t.title}`}
              >
                <Icons.close />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PaymentSheet({
  projectId,
  remaining,
  open,
  onOpenChange
}: {
  projectId: number;
  remaining: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useApiMutation(addProjectPayment, {
    success: 'Pagamento registrado',
    onSuccess: () => onOpenChange(false)
  });
  const form = useAppForm({
    defaultValues: {
      amount: remaining > 0 ? remaining : undefined,
      date: todayISO(),
      description: ''
    } as z.input<typeof projectPaymentSchema>,
    validators: { onSubmit: projectPaymentSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        projectId,
        amount: value.amount!,
        date: value.date,
        description: value.description
      });
      form.reset();
    }
  });

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title='Registrar pagamento'
      description='Entra como receita paga no financeiro.'
      formId='payment-form'
      loading={mutation.isPending}
    >
      <form
        id='payment-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
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
            children={(field) => <field.TextField label='Data' required type='date' />}
          />
          <form.AppField
            name='description'
            children={(field) => (
              <field.TextField label='Descrição' placeholder='Ex.: Entrada 50%' />
            )}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}
