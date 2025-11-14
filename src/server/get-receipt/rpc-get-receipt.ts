import { createServerFn } from "@tanstack/react-start";
import { getReceiptIsValid, getReceiptWithItems } from "./get-receipt-service";

export const getReceiptRpc = createServerFn({ method: 'GET' })
    .inputValidator((receiptId: string) => receiptId)
    .handler(async ({ data: receiptId }) => {
        return getReceiptWithItems(receiptId);
    });

export const getReceiptIsValidRpc = createServerFn({ method: 'GET' })
    .inputValidator((receiptId: string) => receiptId)
    .handler(async ({ data: receiptId }) => {
        return getReceiptIsValid(receiptId);
    });
