import {
  getUserRpc,
  getUserWithRedirect,
} from '@/features/account/server/account-rpc';
import { queryOptions } from '@tanstack/react-query';

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
