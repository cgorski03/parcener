import { expect } from '@playwright/test';
import {
  addReceiptItems,
  setReceiptProcessingStatus,
  updateReceiptTotals,
} from '../factories';
import type { ReceiptItemInput } from '../factories/';
import type { Page } from '@playwright/test';
import type { DbType } from '@/shared/server/db';

interface setupSuccessfulReceiptForReviewRequest {
  items: Array<ReceiptItemInput>;
  db: DbType;
  page: Page;
}
export async function setupReceiptForReviewSuccess(
  request: setupSuccessfulReceiptForReviewRequest,
) {
  const { items, db, page } = request;

  await expect(page).toHaveURL(/\/receipt\/review\/[a-f0-9-]+/);

  const urlMatch = page.url().match(/\/receipt\/review\/([a-f0-9-]+)/);
  const receiptId = urlMatch ? urlMatch[1] : null;
  expect(receiptId).toBeTruthy();

  if (!receiptId) throw new Error('Could not extract receiptId from URL');

  // ============================================
  // ACT 2: Mock AI Processing
  // ============================================

  await setReceiptProcessingStatus(db, receiptId, 'processing');
  await expect(page.getByText('Processing your receipt')).toBeVisible();

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  await updateReceiptTotals(db, receiptId, {
    subtotal: subtotal.toString(),
    grandTotal: subtotal.toString(),
    tax: '0',
    tip: '0',
  });
  await addReceiptItems(db, receiptId, items);
  await setReceiptProcessingStatus(db, receiptId, 'success');
}
