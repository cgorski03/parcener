import { createServerFn } from "@tanstack/react-start";
import { getReceiptIsValid, getReceiptWithItems } from "./get-receipt-service";

export const getReceiptRpc = createServerFn({ method: 'GET' })
    .inputValidator((receiptId: string) => receiptId)
    .handler(async ({ data: receiptId, context }) => {
        return getReceiptWithItems(context.db, receiptId);
    });

export const getReceiptIsValidRpc = createServerFn({ method: 'GET' })
    .inputValidator((receiptId: string) => receiptId)
    .handler(async ({ data: receiptId, context }) => {
        return getReceiptIsValid(context.db, receiptId);
    });
