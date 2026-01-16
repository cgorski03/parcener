import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { getUserUploadRateLimitRpc, uploadReceipt } from '../server/upload-rpc';
import type { GoogleThinkingLevel } from '../server/types';

export const UploadQueryKeys = {
  all: ['upload'] as const,
  rateLimit: () => [...UploadQueryKeys.all, 'rateLimit'] as const,
  recents: () => [...UploadQueryKeys.all, 'recents'] as const,
};

export const uploadRateLimitOptions = queryOptions({
  queryKey: UploadQueryKeys.rateLimit(),
  queryFn: async () => {
    return await getUserUploadRateLimitRpc();
  },
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

export function useUploadReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: UploadQueryKeys.all,
    mutationFn: async (data: {
      file: File;
      thinkingLevel: GoogleThinkingLevel;
    }) => {
      const { file, thinkingLevel } = data;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('thinkingLevel', thinkingLevel);
      return await uploadReceipt({ data: formData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: UploadQueryKeys.all,
      });
    },
  });
}
