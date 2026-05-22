import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { CreateJobPayload } from '../api/types';

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJobPayload) => api.jobs.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
