import { describe, expect, it } from 'vitest';
import { calculateItemTotal, moneyValuesEqual } from './money-math';

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
});
