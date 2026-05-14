import { describe, expect, it } from 'vitest';
import {
  googleThinkingLevelSchema,
  modelParsedReceiptSchema,
  uploadReceiptSchema,
} from './types';

describe('googleThinkingLevelSchema', () => {
  it('accepts valid thinking levels', () => {
    expect(googleThinkingLevelSchema.parse('low')).toBe('low');
    expect(googleThinkingLevelSchema.parse('medium')).toBe('medium');
    expect(googleThinkingLevelSchema.parse('high')).toBe('high');
  });

  it('defaults to medium when not provided', () => {
    expect(googleThinkingLevelSchema.parse(undefined)).toBe('medium');
  });

  it('rejects invalid thinking levels', () => {
    expect(() => googleThinkingLevelSchema.parse('invalid')).toThrow();
    expect(() => googleThinkingLevelSchema.parse('extreme')).toThrow();
    expect(() => googleThinkingLevelSchema.parse('Low')).toThrow(); // Case-sensitive
    expect(() => googleThinkingLevelSchema.parse(123)).toThrow();
    expect(() => googleThinkingLevelSchema.parse(null)).toThrow();
  });
});

describe('uploadReceiptSchema', () => {
  it('parses FormData with file and thinking level', () => {
    const formData = new FormData();
    const file = new File(['test content'], 'receipt.jpg', {
      type: 'image/jpeg',
    });
    formData.append('file', file);
    formData.append('thinkingLevel', 'high');

    const result = uploadReceiptSchema.parse(formData);

    expect(result.file).toBe(file);
    expect(result.thinkingLevel).toBe('high');
  });

  it('defaults to medium thinking level when not provided', () => {
    const formData = new FormData();
    const file = new File(['test content'], 'receipt.jpg', {
      type: 'image/jpeg',
    });
    formData.append('file', file);

    const result = uploadReceiptSchema.parse(formData);

    expect(result.file).toBe(file);
    expect(result.thinkingLevel).toBe('medium');
  });

  it('parses each valid thinking level correctly', () => {
    const thinkingLevels = ['low', 'medium', 'high'] as const;

    for (const level of thinkingLevels) {
      const formData = new FormData();
      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('thinkingLevel', level);

      const result = uploadReceiptSchema.parse(formData);
      expect(result.thinkingLevel).toBe(level);
    }
  });

  it('throws error when file is missing', () => {
    const formData = new FormData();
    formData.append('thinkingLevel', 'medium');

    expect(() => uploadReceiptSchema.parse(formData)).toThrow(
      'File is required',
    );
  });

  it('throws error when file is not a File instance', () => {
    const formData = new FormData();
    formData.append('file', 'not a file');
    formData.append('thinkingLevel', 'medium');

    expect(() => uploadReceiptSchema.parse(formData)).toThrow(
      'File is required',
    );
  });

  it('throws error for invalid thinking level', () => {
    const formData = new FormData();
    const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
    formData.append('file', file);
    formData.append('thinkingLevel', 'invalid');

    expect(() => uploadReceiptSchema.parse(formData)).toThrow();
  });
});

describe('modelParsedReceiptSchema', () => {
  it('accepts valid receipt data', () => {
    const validReceipt = {
      items: [
        {
          rawText: 'Burger',
          interpreted: 'Cheeseburger',
          price: 15.99,
          quantity: 1,
        },
      ],
      subtotal: 15.99,
      tax: 1.2,
      tip: 3.0,
      total: 20.19,
      metadata: {
        restaurant: 'Test Restaurant',
        date: '2026-01-16',
      },
    };

    const result = modelParsedReceiptSchema.parse(validReceipt);
    expect(result).toEqual({
      ...validReceipt,
      items: [
        {
          ...validReceipt.items[0],
          taxCode: null,
          itemizedTaxStatus: null,
        },
      ],
      taxAllocationMode: 'receipt_level',
      taxCodes: [],
      miscFees: [],
    });
  });

  it('defaults optional fields when not provided', () => {
    const receipt = {
      items: [
        {
          rawText: 'Item',
          interpreted: 'Item',
          price: 10,
          quantity: 1,
        },
      ],
      subtotal: 10,
      total: 10,
    };

    const result = modelParsedReceiptSchema.parse(receipt);
    expect(result.tax).toBe(0);
    expect(result.tip).toBe(0);
    expect(result.taxCodes).toEqual([]);
    expect(result.miscFees).toEqual([]);
    expect(result.items[0].taxCode).toBeNull();
    expect(result.items[0].itemizedTaxStatus).toBeNull();
    expect(result.taxAllocationMode).toBe('receipt_level');
  });

  it('defaults quantity to 1 when not provided', () => {
    const receipt = {
      items: [
        {
          rawText: 'Item',
          interpreted: 'Item',
          price: 10,
        },
      ],
      subtotal: 10,
      total: 10,
    };

    const result = modelParsedReceiptSchema.parse(receipt);
    expect(result.items[0].quantity).toBe(1);
  });

  it('accepts optional itemized tax codes and misc fees', () => {
    const receipt = {
      items: [
        {
          rawText: '1819440 KS GOLF V3.0 29.99 A',
          interpreted: 'KS Golf V3.0',
          price: 29.99,
          quantity: 1,
          taxCode: 'A',
          itemizedTaxStatus: 'taxable',
        },
        {
          rawText: 'YOGGIES 30CT 12.89',
          interpreted: 'Yoggies 30ct',
          price: 12.89,
          quantity: 1,
          taxCode: null,
          itemizedTaxStatus: 'exempt',
        },
      ],
      taxAllocationMode: 'itemized',
      taxCodes: [
        {
          code: 'A',
          label: 'A 6.35% TAX',
          rateBps: 635,
        },
      ],
      miscFees: [
        {
          rawText: 'CC FEE 1.25',
          interpreted: 'Credit card fee',
          amount: 1.25,
        },
      ],
      subtotal: 42.88,
      tax: 1.9,
      tip: 0,
      total: 46.03,
    };

    const result = modelParsedReceiptSchema.parse(receipt);
    expect(result.taxCodes).toEqual(receipt.taxCodes);
    expect(result.miscFees).toEqual(receipt.miscFees);
    expect(result.taxAllocationMode).toBe('itemized');
    expect(result.items[0].taxCode).toBe('A');
    expect(result.items[0].itemizedTaxStatus).toBe('taxable');
    expect(result.items[1].taxCode).toBeNull();
    expect(result.items[1].itemizedTaxStatus).toBe('exempt');
  });

  it('accepts tax code without a visible rate', () => {
    const receipt = {
      items: [
        {
          rawText: 'Item 10.00 T',
          interpreted: 'Item',
          price: 10,
          taxCode: 'T',
          itemizedTaxStatus: 'unknown',
        },
      ],
      taxAllocationMode: 'itemized',
      taxCodes: [
        {
          code: 'T',
          label: 'Taxable',
        },
      ],
      subtotal: 10,
      tax: 1,
      total: 11,
    };

    const result = modelParsedReceiptSchema.parse(receipt);
    expect(result.taxCodes[0]).toEqual({
      code: 'T',
      label: 'Taxable',
      rateBps: null,
    });
    expect(result.items[0].itemizedTaxStatus).toBe('unknown');
  });

  it('rejects invalid tax allocation values, tax codes, and misc fees', () => {
    const baseReceipt = {
      items: [
        {
          rawText: 'Item',
          interpreted: 'Item',
          price: 10,
        },
      ],
      subtotal: 10,
      total: 10,
    };

    expect(() =>
      modelParsedReceiptSchema.parse({
        ...baseReceipt,
        taxAllocationMode: 'partial_itemized',
      }),
    ).toThrow();

    expect(() =>
      modelParsedReceiptSchema.parse({
        ...baseReceipt,
        items: [
          {
            rawText: 'Item',
            interpreted: 'Item',
            price: 10,
            itemizedTaxStatus: 'maybe',
          },
        ],
      }),
    ).toThrow();

    expect(() =>
      modelParsedReceiptSchema.parse({
        ...baseReceipt,
        taxCodes: [{ code: '', label: 'Tax', rateBps: 100 }],
      }),
    ).toThrow();

    expect(() =>
      modelParsedReceiptSchema.parse({
        ...baseReceipt,
        taxCodes: [{ code: 'A', label: 'Tax', rateBps: 10.5 }],
      }),
    ).toThrow();

    expect(() =>
      modelParsedReceiptSchema.parse({
        ...baseReceipt,
        miscFees: [
          {
            rawText: 'CC FEE -1.25',
            interpreted: 'Credit card fee',
            amount: -1.25,
          },
        ],
      }),
    ).toThrow();
  });

  it('rejects receipt with no items', () => {
    const receipt = {
      items: [],
      subtotal: 0,
      total: 0,
    };

    expect(() => modelParsedReceiptSchema.parse(receipt)).toThrow(
      'Receipt must have at least one item',
    );
  });

  it('rejects negative prices', () => {
    const receipt = {
      items: [
        {
          rawText: 'Item',
          interpreted: 'Item',
          price: -10,
          quantity: 1,
        },
      ],
      subtotal: 10,
      total: 10,
    };

    expect(() => modelParsedReceiptSchema.parse(receipt)).toThrow();
  });

  it('rejects non-positive total', () => {
    const receipt = {
      items: [
        {
          rawText: 'Item',
          interpreted: 'Item',
          price: 10,
          quantity: 1,
        },
      ],
      subtotal: 10,
      total: 0,
    };

    expect(() => modelParsedReceiptSchema.parse(receipt)).toThrow();
  });

  it('rejects zero or negative quantity', () => {
    const receiptZeroQuantity = {
      items: [
        {
          rawText: 'Item',
          interpreted: 'Item',
          price: 10,
          quantity: 0,
        },
      ],
      subtotal: 10,
      total: 10,
    };

    expect(() => modelParsedReceiptSchema.parse(receiptZeroQuantity)).toThrow();

    const receiptNegativeQuantity = {
      items: [
        {
          rawText: 'Item',
          interpreted: 'Item',
          price: 10,
          quantity: -1,
        },
      ],
      subtotal: 10,
      total: 10,
    };

    expect(() =>
      modelParsedReceiptSchema.parse(receiptNegativeQuantity),
    ).toThrow();
  });
});
