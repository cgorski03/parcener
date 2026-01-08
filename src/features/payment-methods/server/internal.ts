/**
 * INTERNAL SERVER API - Payment Methods Feature
 *
 * These functions are for server-to-server calls ONLY.
 * Client code should use RPCs from payment-method-rpc.ts.
 *
 * Consumers:
 * - features/room (getPaymentMethodSecure)
 */

export { getPaymentMethodSecure } from './payment-method-service';
