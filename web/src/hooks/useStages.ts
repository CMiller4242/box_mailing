import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useStages() {
  return useQuery({
    queryKey: ['stages'],
    queryFn: api.workflow.stages,
    staleTime: 5 * 60 * 1000, // stages rarely change
  });
}
