import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useJobs(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['jobs', filters ?? {}],
    queryFn: () => api.jobs.list(filters),
  });
}
