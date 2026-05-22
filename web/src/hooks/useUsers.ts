import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
    staleTime: 2 * 60 * 1000,
  });
}
