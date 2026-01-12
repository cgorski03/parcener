import {
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { getUserUploadRateLimitRpc } from '../server/upload-rpc';
import { UploadQueryKeys } from './use-upload-receipt';

const uploadRateLimitQueryOptions = queryOptions({
  queryKey: UploadQueryKeys.rateLimit(),
  queryFn: async () => {
    const limits = await getUserUploadRateLimitRpc();
    return limits;
  },
  staleTime: 1000 * 60 * 5,
});

export function useUploadRateLimit() {
  return useQuery(uploadRateLimitQueryOptions);
}

export function useUploadRateLimitSuspense() {
  return useSuspenseQuery(uploadRateLimitQueryOptions);
}
