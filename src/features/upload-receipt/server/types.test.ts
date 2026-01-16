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
    expect(result).toEqual(validReceipt);
  });

  it('defaults tax and tip to 0 when not provided', () => {
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
