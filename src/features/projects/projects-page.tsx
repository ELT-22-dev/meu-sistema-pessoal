'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/icons';
import { DataList } from '@/components/app/data-list';
import {
  FilterBar,
  SearchBox,
  SelectFilter,
  useSearchParam,
  useSelectParam
} from '@/components/app/filters';
import { ProjectStatusBadge, ProjectTypeLabel } from '@/components/app/status-badge';
import { DueLabel } from '@/components/app/due-label';
import { PROJECT_STATUS, PROJECT_TYPES } from '@/config/options';
import { formatMoney } from '@/lib/format';
import { projectsQuery, type ProjectRow } from './api';
import { ProjectFormSheet } from './project-form';

const STATUS_FILTER = [{ value: 'ativos', label: 'Em aberto' }, ...PROJECT_STATUS];

function Received({ p }: { p: ProjectRow }) {
  const pct = p.value > 0 ? Math.min(100, (p.received / p.value) * 100) : 0;
  return (
    <div className='min-w-28'>
      <div className='text-xs tabular-nums'>
        {formatMoney(p.received)}{' '}
        <span className='text-muted-foreground'>/ {formatMoney(p.value)}</span>
      </div>
      <Progress value={pct} className='mt-1 h-1.5' />
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { search, value, setValue } = useSearchParam();
  const [status, setStatus] = useSelectParam('status');
  const [type, setType] = useSelectParam('type');
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery(projectsQuery({ search, status, type }));

  const openProject = (p: ProjectRow) => router.push(`/dashboard/projetos/${p.id}`);

  return (
    <PageContainer
      pageTitle='Projetos'
      pageDescription='Sites, sistemas e automações em andamento.'
      pageHeaderAction={
        <Button onClick={() => setOpen(true)}>
          <Icons.add /> <span className='hidden sm:inline'>Novo projeto</span>
          <span className='sm:hidden'>Novo</span>
        </Button>
      }
    >
      <FilterBar>
        <SearchBox value={value} onChange={setValue} placeholder='Buscar projeto ou cliente' />
        <div className='grid grid-cols-2 gap-2 sm:flex'>
          <SelectFilter
            label='Status'
            value={status}
            onChange={setStatus}
            options={STATUS_FILTER}
          />
          <SelectFilter label='Tipo' value={type} onChange={setType} options={PROJECT_TYPES} />
        </div>
      </FilterBar>

      <DataList
        rows={data}
        isLoading={isLoading}
        getKey={(p) => p.id}
        onRowClick={openProject}
        empty={{
          icon: <Icons.projects />,
          title: 'Nenhum projeto aqui',
          description:
            search || status || type ? 'Ajuste os filtros.' : 'Crie seu primeiro projeto.',
          action: !(search || status || type) && (
            <Button onClick={() => setOpen(true)}>
              <Icons.add /> Novo projeto
            </Button>
          )
        }}
        columns={[
          {
            header: 'Projeto',
            cell: (p) => (
              <div>
                <div className='font-medium'>{p.title}</div>
                <div className='text-muted-foreground text-xs'>
                  {p.clientName ?? 'Sem cliente'} · <ProjectTypeLabel type={p.type} />
                </div>
              </div>
            )
          },
          { header: 'Status', cell: (p) => <ProjectStatusBadge status={p.status} /> },
          {
            header: 'Prazo',
            cell: (p) =>
              p.dueDate ? <DueLabel date={p.dueDate} done={p.status === 'concluido'} /> : '—'
          },
          {
            header: 'Tarefas',
            className: 'text-center',
            cell: (p) => (p.totalTasks > 0 ? `${p.totalTasks - p.openTasks}/${p.totalTasks}` : '—')
          },
          { header: 'Recebido', cell: (p) => <Received p={p} /> }
        ]}
        card={(p) => (
          <div className='space-y-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <div className='truncate font-medium'>{p.title}</div>
                <div className='text-muted-foreground truncate text-xs'>
                  {p.clientName ?? 'Sem cliente'} · <ProjectTypeLabel type={p.type} />
                </div>
              </div>
              <ProjectStatusBadge status={p.status} />
            </div>
            <div className='flex items-end justify-between gap-3'>
              <Received p={p} />
              {p.dueDate && <DueLabel date={p.dueDate} done={p.status === 'concluido'} />}
            </div>
          </div>
        )}
      />

      <ProjectFormSheet
        open={open}
        onOpenChange={setOpen}
        onSaved={(p) => router.push(`/dashboard/projetos/${p.id}`)}
      />
    </PageContainer>
  );
}
