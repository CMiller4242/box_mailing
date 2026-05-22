import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useDeleteFile(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, actorId }: { fileId: string; actorId?: string }) =>
      api.files.delete(jobId, fileId, actorId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}
