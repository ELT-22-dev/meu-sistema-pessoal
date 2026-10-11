import { queryOptions } from '@tanstack/react-query';
import { api, qs } from '@/lib/api-client';
import type { Client, Project, Task, Transaction } from '@/db/schema';
import type { ProjectInput } from './schema';

export type ProjectRow = Project & {
  clientName: string | null;
  received: number;
  openTasks: number;
  totalTasks: number;
};

export type ProjectDetail = Project & {
  client: Client | null;
  tasks: Task[];
  payments: Transaction[];
  received: number;
};

export type ProjectFilters = { search?: string; status?: string; type?: string };

export const projectsQuery = (filters: ProjectFilters = {}) =>
  queryOptions({
    queryKey: ['projects', 'list', filters],
    queryFn: () => api.get<ProjectRow[]>(`/projetos${qs(filters)}`)
  });

export const projectQuery = (id: number) =>
  queryOptions({
    queryKey: ['projects', 'detail', id],
    queryFn: () => api.get<ProjectDetail>(`/projetos/${id}`)
  });

export const saveProject = ({ id, values }: { id?: number; values: ProjectInput }) =>
  id ? api.put<Project>(`/projetos/${id}`, values) : api.post<Project>('/projetos', values);

export const deleteProject = (id: number) => api.delete(`/projetos/${id}`);

export const addTask = ({
  projectId,
  title,
  dueDate
}: {
  projectId: number;
  title: string;
  dueDate?: string;
}) => api.post<Task>(`/projetos/${projectId}/tarefas`, { title, dueDate: dueDate ?? '' });

export const updateTask = ({ id, ...values }: { id: number; done?: boolean; title?: string }) =>
  api.patch<Task>(`/tarefas/${id}`, values);

export const deleteTask = (id: number) => api.delete(`/tarefas/${id}`);

export const addProjectPayment = ({
  projectId,
  ...values
}: {
  projectId: number;
  amount: number;
  date: string;
  description?: string | null;
}) => api.post<Transaction>(`/projetos/${projectId}/pagamentos`, values);
