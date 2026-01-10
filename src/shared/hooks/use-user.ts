import { queryOptions } from '@tanstack/react-query';
import {
  getUserRpc,
  getUserWithRedirect,
} from '@/features/account/server/account-rpc';

export const userQueryOptions = queryOptions({
  queryKey: ['user'],
  queryFn: async () => {
    const user = await getUserRpc();
    return user ?? null;
  },
});

export const userQueryOptionsWithRedirect = queryOptions({
  queryKey: ['user'],
  queryFn: async () => {
    const user = await getUserWithRedirect();
    return user;
  },
});
