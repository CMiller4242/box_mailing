import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api.jobs.get(id),
    enabled: Boolean(id),
  });
}
