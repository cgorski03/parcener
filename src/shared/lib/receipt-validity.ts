import { calculateItemTotal, moneyValuesEqual } from './money-math';
import type { ReceiptValidityState } from '@/shared/server/db';

export type ReceiptLikeForValidation = {
  items: Array<{ price: number }>;
  subtotal: number;
  tax: number;
  tip: number;
  grandTotal: number;
};

type ReceiptValidationResult =
  | { isValid: true }
  | {
      isValid: false;
      error:
        | {
            code: 'SUBTOTAL_MISMATCH';
            clientSubtotal: number;
            serverSubtotal: number;
          }
        | {
            code: 'GRANDTOTAL_MISMATCH';
            clientGrandTotal: number;
            serverGrandTotal: number;
          };
    };

function validateReceiptCalculations(
  receipt: ReceiptLikeForValidation,
): ReceiptValidationResult {
  const calculatedSubtotal = calculateItemTotal(receipt.items);

  if (!moneyValuesEqual(receipt.subtotal, calculatedSubtotal)) {
    return {
      isValid: false,
      error: {
        code: 'SUBTOTAL_MISMATCH',
        clientSubtotal: calculatedSubtotal,
        serverSubtotal: receipt.subtotal,
      },
    };
  }

  const calculatedGrandTotal = receipt.subtotal + receipt.tax + receipt.tip;

  if (!moneyValuesEqual(receipt.grandTotal, calculatedGrandTotal)) {
    return {
      isValid: false,
      error: {
        code: 'GRANDTOTAL_MISMATCH',
        clientGrandTotal: calculatedGrandTotal,
        serverGrandTotal: receipt.grandTotal,
      },
    };
  }

  return { isValid: true };
}

export type ValidityState =
  | { status: Extract<ReceiptValidityState, 'valid'> }
  | {
      status: Extract<ReceiptValidityState, 'subtotal_mismatch'>;
      clientSubtotal: number;
      serverSubtotal: number;
    }
  | {
      status: Extract<ReceiptValidityState, 'grandtotal_mismatch'>;
      clientGrandTotal: number;
      serverGrandTotal: number;
    };

export function computeReceiptValidity(
  receipt: ReceiptLikeForValidation,
): ValidityState {
  const validation = validateReceiptCalculations(receipt);

  if (validation.isValid) {
    return { status: 'valid' };
  }

  const { error } = validation;
  if (error.code === 'SUBTOTAL_MISMATCH') {
    return {
      status: 'subtotal_mismatch',
      clientSubtotal: error.clientSubtotal,
      serverSubtotal: error.serverSubtotal,
    };
  }

  return {
    status: 'grandtotal_mismatch',
    clientGrandTotal: error.clientGrandTotal,
    serverGrandTotal: error.serverGrandTotal,
  };
}
