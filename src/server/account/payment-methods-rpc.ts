import { createServerFn } from "@tanstack/react-start";
import { protectedFunctionMiddleware } from "../auth/protected-function";
import { nameTransaction } from "../observability/sentry-middleware";
import { logger } from "@/lib/logger";
import { SENTRY_EVENTS } from "@/lib/sentry-events";
import { createPaymentMethodRequest, paymentMethodIdSchema } from "../dtos";
import { createUserPaymentMethod, deleteUserPaymentMethod, getUserPaymentMethods } from "./payment-method-service";


export const createPaymentMethod = createServerFn({ method: 'POST' })
    .middleware([nameTransaction('createPaymentMethod'), protectedFunctionMiddleware])
    .inputValidator(createPaymentMethodRequest)
    .handler(async ({ context, data: request }) => {
        try {
            return await createUserPaymentMethod(context.db, context.user, request);
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.ACCOUNT.PAYMENT_METHOD.CREATE, {
                userId: context.user.id
            })
            throw error;
        }
    });

export const getPaymentMethods = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getPaymentMethods'), protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        try {
            return await getUserPaymentMethods(context.db, context.user);
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.ACCOUNT.PAYMENT_METHOD.GET, {
                userId: context.user.id
            })
            throw error;
        }
    });

export const deletePaymentMethod = createServerFn({ method: 'POST' })
    .middleware([nameTransaction('deletePaymentMethod'), protectedFunctionMiddleware])
    .inputValidator(paymentMethodIdSchema)
    .handler(async ({ context, data: request }) => {
        try {
            await deleteUserPaymentMethod(context.db, context.user, request.paymentMethodId);
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.ACCOUNT.PAYMENT_METHOD.DELETE, {
                userId: context.user.id
            })
            throw error;
        }
    });
