import { describe, it, expect } from 'vitest';
import {
    calculateItemTotal,
    moneyValuesEqual,
    validateReceiptCalculations,
} from './money-math';

describe('money-math', () => {
    describe('calculateItemTotal', () => {
        it('returns 0 for empty items array', () => {
            const result = calculateItemTotal([]);

            expect(result).toBe(0);
        });

        it('sums item prices correctly', () => {
            const items = [{ price: 10.5 }, { price: 5.25 }, { price: 3.99 }] as any;

            const result = calculateItemTotal(items);

            expect(result).toBeCloseTo(19.74, 0.001);
        });

        it('handles decimal prices', () => {
            const items = [{ price: 0.99 }, { price: 1.99 }] as any;

            const result = calculateItemTotal(items);

            expect(result).toBe(2.98);
        });
    });

    describe('moneyValuesEqual', () => {
        it('returns true for equal values', () => {
            const result = moneyValuesEqual(10.5, 10.5);

            expect(result).toBe(true);
        });

        it('returns true for values within epsilon', () => {
            const result = moneyValuesEqual(10.5, 10.505);

            expect(result).toBe(true);
        });

        it('returns false for values outside epsilon', () => {
            const result = moneyValuesEqual(10.5, 10.52);

            expect(result).toBe(false);
        });

        it('handles zero values', () => {
            const result = moneyValuesEqual(0, 0.001);

            expect(result).toBe(true);
        });
    });

    describe('validateReceiptCalculations', () => {
        it('returns valid for correct calculations', () => {
            const receipt = {
                receiptId: '00000000-0000-0000-0000-000000000000',
                title: null,
                createdAt: null,
                items: [{ price: 10 } as any, { price: 5 } as any],
                subtotal: 15,
                tax: 1.5,
                tip: 3,
                grandTotal: 19.5,
            };

            const result = validateReceiptCalculations(receipt);

            expect(result).toEqual({ isValid: true });
        });

        it('returns subtotal mismatch when calculated subtotal differs', () => {
            const receipt = {
                receiptId: '00000000-0000-0000-0000-000000000000',
                title: null,
                createdAt: null,
                items: [{ price: 10 } as any, { price: 5 } as any],
                subtotal: 20,
                tax: 1.5,
                tip: 3,
                grandTotal: 24.5,
            };

            const result = validateReceiptCalculations(receipt);

            expect(result).toEqual({
                isValid: false,
                error: {
                    code: 'SUBTOTAL_MISMATCH',
                    clientSubtotal: 15,
                    serverSubtotal: 20,
                },
            });
        });

        it('returns grand total mismatch when calculated total differs', () => {
            const receipt = {
                receiptId: '00000000-0000-0000-0000-000000000000',
                title: null,
                createdAt: null,
                items: [{ price: 10 } as any, { price: 5 } as any],
                subtotal: 15,
                tax: 1.5,
                tip: 3,
                grandTotal: 25,
            };

            const result = validateReceiptCalculations(receipt);

            expect(result).toEqual({
                isValid: false,
                error: {
                    code: 'GRANDTOTAL_MISMATCH',
                    clientGrandTotal: 19.5,
                    serverGrandTotal: 25,
                },
            });
        });

        it('handles zero tax and tip', () => {
            const receipt = {
                receiptId: '00000000-0000-0000-0000-000000000000',
                title: null,
                createdAt: null,
                items: [{ price: 10 } as any],
                subtotal: 10,
                tax: 0,
                tip: 0,
                grandTotal: 10,
            };

            const result = validateReceiptCalculations(receipt);

            expect(result).toEqual({ isValid: true });
        });

        it('handles decimal precision', () => {
            const receipt = {
                receiptId: '00000000-0000-0000-0000-000000000000',
                title: null,
                createdAt: null,
                items: [{ price: 10.99 } as any, { price: 5.49 } as any],
                subtotal: 16.48,
                tax: 1.48,
                tip: 3.3,
                grandTotal: 21.26,
            };

            const result = validateReceiptCalculations(receipt);

            expect(result).toEqual({ isValid: true });
        });
    });
});
