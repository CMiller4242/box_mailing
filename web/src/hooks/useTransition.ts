import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { TransitionPayload } from '../api/types';

export function useTransition(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransitionPayload) =>
      api.workflow.transition(jobId, payload),
    onSuccess: () => {
      // Refresh both the detail view and the list
      void qc.invalidateQueries({ queryKey: ['jobs', jobId] });
      void qc.invalidateQueries({ queryKey: ['jobs', {}] });
    },
  });
}
