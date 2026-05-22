import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { RenameFilePayload } from '../api/types';

export function useRenameFile(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, payload }: { fileId: string; payload: RenameFilePayload }) =>
      api.files.rename(jobId, fileId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}
