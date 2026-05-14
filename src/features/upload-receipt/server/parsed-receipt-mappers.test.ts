import { describe, expect, it } from 'vitest';
import {
  buildReceiptFeeRows,
  buildReceiptItemRows,
  buildTaxCodeRows,
} from './parsed-receipt-mappers';
import type { ModelParsedReceiptType } from './types';

const receiptId = '00000000-0000-4000-8000-000000000001';

function parsedReceipt(
  overrides: Partial<ModelParsedReceiptType> = {},
): ModelParsedReceiptType {
  return {
    items: [
      {
        rawText: 'Item 10.00',
        interpreted: 'Item',
        price: 10,
        quantity: 1,
        taxCode: null,
        itemizedTaxStatus: null,
      },
    ],
    taxAllocationMode: 'receipt_level',
    taxCodes: [],
    miscFees: [],
    subtotal: 10,
    tax: 0,
    tip: 0,
    total: 10,
    metadata: {
      restaurant: 'Test',
      date: null,
    },
    ...overrides,
  };
}

describe('parsed receipt mappers', () => {
  it('dedupes tax codes by printed code', () => {
    const rows = buildTaxCodeRows(receiptId, [
      { code: 'A', label: 'A 6.35% TAX', rateBps: 635 },
      { code: 'A', label: 'Duplicate A', rateBps: 635 },
      { code: 'B', label: 'B 1.00% TAX', rateBps: 100 },
    ]);

    expect(rows).toEqual([
      {
        receiptId,
        code: 'A',
        label: 'A 6.35% TAX',
        rateBps: 635,
        orderIndex: 0,
        source: 'model',
      },
      {
        receiptId,
        code: 'B',
        label: 'B 1.00% TAX',
        rateBps: 100,
        orderIndex: 2,
        source: 'model',
      },
    ]);
  });

  it('preserves itemized tax classifications and resolves known tax codes', () => {
    const receipt = parsedReceipt({
      taxAllocationMode: 'itemized',
      items: [
        {
          rawText: 'GOLF 29.99 A',
          interpreted: 'Golf',
          price: 29.99,
          quantity: 1,
          taxCode: 'A',
          itemizedTaxStatus: 'taxable',
        },
        {
          rawText: 'YOGGIES 12.89',
          interpreted: 'Yoggies',
          price: 12.89,
          quantity: 1,
          taxCode: null,
          itemizedTaxStatus: 'exempt',
        },
        {
          rawText: 'ODD ITEM 4.00 Z',
          interpreted: 'Odd item',
          price: 4,
          quantity: 1,
          taxCode: 'Z',
          itemizedTaxStatus: 'unknown',
        },
      ],
    });

    const { newReceiptItems, newReceiptItemTaxClassifications } =
      buildReceiptItemRows({
        receiptId,
        parsedReceipt: receipt,
        taxCodeIdByCode: new Map([['A', 'tax-code-a-id']]),
      });

    expect(newReceiptItems).toHaveLength(3);
    expect(newReceiptItems.map((item) => item.interpretedText)).toEqual([
      'Golf',
      'Yoggies',
      'Odd item',
    ]);

    expect(newReceiptItemTaxClassifications).toEqual([
      {
        receiptId,
        receiptItemId: newReceiptItems[0].id,
        taxCodeId: 'tax-code-a-id',
        status: 'taxable',
        source: 'model',
      },
      {
        receiptId,
        receiptItemId: newReceiptItems[1].id,
        taxCodeId: null,
        status: 'exempt',
        source: 'model',
      },
      {
        receiptId,
        receiptItemId: newReceiptItems[2].id,
        taxCodeId: null,
        status: 'unknown',
        source: 'model',
      },
    ]);
  });

  it('does not create classifications for receipt-level mode', () => {
    const receipt = parsedReceipt({
      taxAllocationMode: 'receipt_level',
      items: [
        {
          rawText: 'Burger 10.00 A',
          interpreted: 'Burger',
          price: 10,
          quantity: 1,
          taxCode: 'A',
          itemizedTaxStatus: 'taxable',
        },
      ],
    });

    const { newReceiptItems, newReceiptItemTaxClassifications } =
      buildReceiptItemRows({
        receiptId,
        parsedReceipt: receipt,
        taxCodeIdByCode: new Map([['A', 'tax-code-a-id']]),
      });

    expect(newReceiptItems).toHaveLength(1);
    expect(newReceiptItemTaxClassifications).toEqual([]);
  });

  it('maps miscellaneous fees to receipt fee rows', () => {
    const rows = buildReceiptFeeRows(receiptId, [
      {
        rawText: 'CC FEE 1.25',
        interpreted: 'Credit card fee',
        amount: 1.25,
      },
      {
        rawText: 'SERVICE CHARGE 3.00',
        interpreted: 'Service charge',
        amount: 3,
      },
    ]);

    expect(rows).toEqual([
      {
        receiptId,
        rawText: 'CC FEE 1.25',
        label: 'Credit card fee',
        amount: '1.25',
        orderIndex: 0,
      },
      {
        receiptId,
        rawText: 'SERVICE CHARGE 3.00',
        label: 'Service charge',
        amount: '3',
        orderIndex: 1,
      },
    ]);
  });
});
