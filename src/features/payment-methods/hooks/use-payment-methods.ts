import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
} from '../server/payment-methods-rpc';
import type {
  CreatePaymentMethodRequest,
  PaymentMethodDto,
} from '@/shared/dto/types';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';

export const PaymentQueryKeys = {
  all: ['paymentMethods'] as const,
};

export const paymentMethodsOptions = (enabled?: boolean) =>
  queryOptions({
    queryKey: PaymentQueryKeys.all,
    queryFn: async () => {
      try {
        return await getPaymentMethods();
      } catch (error) {
        logger.error(error, SENTRY_EVENTS.ACCOUNT.PAYMENT_METHOD.GET);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled: enabled ?? true,
  });
/**
 * Hook to fetch all payment methods for the current user
 */
export const usePaymentMethodsSuspense = () => {
  const { data, ...rest } = useSuspenseQuery(paymentMethodsOptions());

  // Since data is guaranteed defined, logic is cleaner
  const defaultPaymentMethod = data.find((pm) => pm.isDefault) || data[0];

  return {
    data,
    defaultPaymentMethod,
    ...rest,
  };
};

export const useDefaultPaymentMethod = () => {
  const { data: paymentMethods, ...rest } = useSuspenseQuery(
    paymentMethodsOptions(),
  );
  const defaultPaymentMethod =
    paymentMethods.length === 0
      ? null
      : paymentMethods.find((pm) => pm.isDefault) || paymentMethods[0];

  return {
    defaultPaymentMethod,
    ...rest,
  };
};
/**
 * Hook to create a new payment method
 */
export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentMethodRequest) => {
      return await createPaymentMethod({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.all });
    },
    onError: (error) => {
      logger.error(error, SENTRY_EVENTS.ACCOUNT.PAYMENT_METHOD.CREATE);
    },
  });
};

/**
 * Hook to delete a payment method
 */
export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return await deletePaymentMethod({ data: { paymentMethodId } });
    },
    onMutate: async (deletedId) => {
      // Optimistic Update: Remove the item from UI immediately
      await queryClient.cancelQueries({ queryKey: PaymentQueryKeys.all });
      const previousMethods = queryClient.getQueryData<Array<PaymentMethodDto>>(
        PaymentQueryKeys.all,
      );

      queryClient.setQueryData(
        PaymentQueryKeys.all,
        (old: Array<PaymentMethodDto>) =>
          old.filter((method) => method.paymentMethodId !== deletedId),
      );

      return { previousMethods };
    },
    onError: (err, deletedId, context) => {
      // Rollback if server call fails
      if (context?.previousMethods) {
        queryClient.setQueryData(PaymentQueryKeys.all, context.previousMethods);
      }
      logger.error(err, SENTRY_EVENTS.ACCOUNT.PAYMENT_METHOD.DELETE, {
        paymentMethodId: deletedId,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.all });
    },
  });
};
