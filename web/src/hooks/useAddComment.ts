import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { AddCommentPayload } from '../api/types';

export function useAddComment(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddCommentPayload) =>
      api.comments.add(jobId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}
