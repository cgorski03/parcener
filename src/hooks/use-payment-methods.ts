import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreatePaymentMethodRequest } from "@/server/dtos";
import { logger } from "@/lib/logger";
import { SENTRY_EVENTS } from "@/lib/sentry-events";
import { createPaymentMethod, deletePaymentMethod, getPaymentMethods } from "@/server/account/payment-methods-rpc";

export const PaymentQueryKeys = {
    all: ["paymentMethods"] as const,
};

/**
 * Hook to fetch all payment methods for the current user
 */
export const usePaymentMethods = () => {
    return useQuery({
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
    });
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
            const previousMethods = queryClient.getQueryData(PaymentQueryKeys.all);

            queryClient.setQueryData(PaymentQueryKeys.all, (old: any) => {
                if (!old) return [];
                return old.filter((method: any) => method.id !== deletedId);
            });

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
