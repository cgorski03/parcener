import type { ModelParsedReceiptType } from './types';
import type {
  NewReceiptFee,
  NewReceiptItem,
  NewReceiptItemTaxClassification,
  NewTaxCode,
} from '@/shared/server/db';

export function buildTaxCodeRows(
  receiptId: string,
  parsedTaxCodes: ModelParsedReceiptType['taxCodes'],
): Array<NewTaxCode> {
  const rows: Array<NewTaxCode> = [];
  const seenTaxCodes = new Set<string>();

  parsedTaxCodes.forEach((code, index) => {
    if (seenTaxCodes.has(code.code)) return;
    seenTaxCodes.add(code.code);
    rows.push({
      receiptId,
      code: code.code,
      rateBps: code.rateBps,
      label: code.label,
      orderIndex: index,
      source: 'model',
    });
  });

  return rows;
}

export function buildReceiptItemRows(request: {
  receiptId: string;
  parsedReceipt: ModelParsedReceiptType;
  taxCodeIdByCode: Map<string, string>;
}): {
  newReceiptItems: Array<NewReceiptItem>;
  newReceiptItemTaxClassifications: Array<NewReceiptItemTaxClassification>;
} {
  const { receiptId, parsedReceipt, taxCodeIdByCode } = request;
  const isItemized = parsedReceipt.taxAllocationMode === 'itemized';
  const newReceiptItems: Array<NewReceiptItem> = [];
  const newReceiptItemTaxClassifications: Array<NewReceiptItemTaxClassification> =
    [];

  parsedReceipt.items.forEach((item, index) => {
    const newItemId = crypto.randomUUID();
    newReceiptItems.push({
      id: newItemId,
      receiptId,
      price: item.price.toString(),
      rawText: item.rawText,
      interpretedText: item.interpreted,
      quantity: item.quantity.toString(),
      orderIndex: index,
    });

    if (isItemized) {
      newReceiptItemTaxClassifications.push({
        receiptId,
        receiptItemId: newItemId,
        taxCodeId: item.taxCode
          ? (taxCodeIdByCode.get(item.taxCode) ?? null)
          : null,
        status: item.itemizedTaxStatus ?? 'unknown',
        source: 'model',
      });
    }
  });

  return { newReceiptItems, newReceiptItemTaxClassifications };
}

export function buildReceiptFeeRows(
  receiptId: string,
  parsedFees: ModelParsedReceiptType['miscFees'],
): Array<NewReceiptFee> {
  return parsedFees.map((fee, index) => ({
    receiptId,
    rawText: fee.rawText,
    label: fee.interpreted,
    amount: fee.amount.toString(),
    orderIndex: index,
  }));
}
