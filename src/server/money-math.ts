import { ReceiptDto, ReceiptItemDto } from './dtos'

const MONEY_EPSILON = 0.01

export const calculateItemTotal = (items: ReceiptItemDto[]) => {
    return items.reduce((sum, item) => sum + item.price, 0)
}

export const moneyValuesEqual = (price1: number, price2: number) =>
    Math.abs(price1 - price2) < MONEY_EPSILON

type ReceiptValidationResult =
    | { isValid: true }
    | {
        isValid: false;
        error:
        | {
            code: "SUBTOTAL_MISMATCH";
            clientSubtotal: number;
            serverSubtotal: number;
        }
        | {
            code: "GRANDTOTAL_MISMATCH";
            clientGrandTotal: number;
            serverGrandTotal: number;
        };
    };

export function validateReceiptCalculations(
    receipt: ReceiptDto,
): ReceiptValidationResult {
    const calculatedSubtotal = calculateItemTotal(receipt.items);

    if (!moneyValuesEqual(receipt.subtotal, calculatedSubtotal)) {
        return {
            isValid: false,
            error: {
                code: "SUBTOTAL_MISMATCH",
                clientSubtotal: calculatedSubtotal,
                serverSubtotal: receipt.subtotal,
            },
        };
    }

    const calculatedGrandTotal = receipt.subtotal + receipt.tax + receipt.tip;

    if (!moneyValuesEqual(receipt.grandTotal ?? 0, calculatedGrandTotal)) {
        return {
            isValid: false,
            error: {
                code: "GRANDTOTAL_MISMATCH",
                clientGrandTotal: calculatedGrandTotal,
                serverGrandTotal: receipt.grandTotal,
            },
        };
    }

    return { isValid: true };
}
