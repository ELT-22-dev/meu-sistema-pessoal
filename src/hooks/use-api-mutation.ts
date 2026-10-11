'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/api-client';

/**
 * Mutation padrão: mostra toast e revalida todas as consultas
 * (os módulos se afetam — ex.: pagamento muda projeto, financeiro e painel).
 */
export function useApiMutation<TVars, TData = unknown>(
  mutationFn: (vars: TVars) => Promise<TData>,
  opts: { success?: string; onSuccess?: (data: TData, vars: TVars) => void } = {}
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data, vars) => {
      if (opts.success) toast.success(opts.success);
      opts.onSuccess?.(data, vars);
      await queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(errorMessage(err))
  });
}
