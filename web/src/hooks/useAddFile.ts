import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { AddFilePayload } from '../api/types';

export function useAddFile(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddFilePayload) => api.files.add(jobId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}
