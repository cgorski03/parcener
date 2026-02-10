import { describe, expect, it } from 'vitest';
import { computeReceiptValidity } from './receipt-validity';

describe('receipt-validity', () => {
  it('returns valid for correct calculations', () => {
    const receipt = {
      items: [{ price: 10 } as any, { price: 5 } as any],
      subtotal: 15,
      tax: 1.5,
      tip: 3,
      grandTotal: 19.5,
    };

    const result = computeReceiptValidity(receipt);

    expect(result).toEqual({ status: 'valid' });
  });

  it('returns subtotal mismatch when calculated subtotal differs', () => {
    const receipt = {
      items: [{ price: 10 } as any, { price: 5 } as any],
      subtotal: 20,
      tax: 1.5,
      tip: 3,
      grandTotal: 24.5,
    };

    const result = computeReceiptValidity(receipt);

    expect(result).toEqual({
      status: 'subtotal_mismatch',
      clientSubtotal: 15,
      serverSubtotal: 20,
    });
  });

  it('returns grand total mismatch when calculated total differs', () => {
    const receipt = {
      items: [{ price: 10 } as any, { price: 5 } as any],
      subtotal: 15,
      tax: 1.5,
      tip: 3,
      grandTotal: 25,
    };

    const result = computeReceiptValidity(receipt);

    expect(result).toEqual({
      status: 'grandtotal_mismatch',
      clientGrandTotal: 19.5,
      serverGrandTotal: 25,
    });
  });

  it('handles zero tax and tip', () => {
    const receipt = {
      items: [{ price: 10 } as any],
      subtotal: 10,
      tax: 0,
      tip: 0,
      grandTotal: 10,
    };

    const result = computeReceiptValidity(receipt);

    expect(result).toEqual({ status: 'valid' });
  });

  it('handles decimal precision', () => {
    const receipt = {
      items: [{ price: 10.99 } as any, { price: 5.49 } as any],
      subtotal: 16.48,
      tax: 1.48,
      tip: 3.3,
      grandTotal: 21.26,
    };

    const result = computeReceiptValidity(receipt);

    expect(result).toEqual({ status: 'valid' });
  });
});
