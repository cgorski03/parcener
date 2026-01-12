import path from 'node:path';
import { expect, test } from '@/test/e2e/fixtures';
import { e2eDb } from '@/test/e2e/db';
import { paymentMethod } from '@/shared/server/db/schema';
import { setReceiptProcessingStatus } from '@/test/factories/receipt';

test.describe('Upload Receipt - Basic States', () => {
  test('shows upload form for authenticated uploader user', async ({
    page,
    authenticateAsUploader,
  }) => {
    await authenticateAsUploader();
    await page.goto('/upload');

    await expect(page.getByText('Split a Receipt')).toBeVisible();
    // File input is hidden/styled, but should be in the DOM
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });

  test('shows processing state after upload', async ({
    page,
    authenticateAsUploader,
  }) => {
    const { user } = await authenticateAsUploader();

    await e2eDb.insert(paymentMethod).values({
      userId: user.id,
      type: 'venmo',
      handle: '@test-venmo',
      isDefault: true,
    });

    await page.goto('/upload');

    const fileInput = page.locator('#receipt');
    const testImagePath = path.join(
      process.cwd(),
      'public/test-images/valid-receipt.jpg',
    );
    await fileInput.setInputFiles(testImagePath);

    const uploadButton = page.getByRole('button', {
      name: 'Process Receipt',
    });
    await uploadButton.click();

    await expect(page).toHaveURL(/\/receipt\/review\/[a-f0-9-]+/);

    const urlMatch = page.url().match(/\/receipt\/review\/([a-f0-9-]+)/);
    const receiptId = urlMatch ? urlMatch[1] : null;
    if (!receiptId) throw new Error('Could not extract receiptId from URL');

    await setReceiptProcessingStatus(e2eDb, receiptId, 'processing');
    await expect(page.getByText('Processing')).toBeVisible();
  });

  test('shows failed processing state', async ({
    page,
    authenticateAsUploader,
  }) => {
    const { user } = await authenticateAsUploader();

    await e2eDb.insert(paymentMethod).values({
      userId: user.id,
      type: 'venmo',
      handle: '@test-venmo',
      isDefault: true,
    });

    await page.goto('/upload');

    const fileInput = page.locator('#receipt');
    const testImagePath = path.join(
      process.cwd(),
      'public/test-images/valid-receipt.jpg',
    );
    await fileInput.setInputFiles(testImagePath);

    const uploadButton = page.getByRole('button', {
      name: 'Process Receipt',
    });
    await uploadButton.click();

    await expect(page).toHaveURL(/\/receipt\/review\/[a-f0-9-]+/);

    const urlMatch = page.url().match(/\/receipt\/review\/([a-f0-9-]+)/);
    const receiptId = urlMatch ? urlMatch[1] : null;
    if (!receiptId) throw new Error('Could not extract receiptId from URL');

    await setReceiptProcessingStatus(e2eDb, receiptId, 'failed');
    await expect(page.getByText('Processing Failed')).toBeVisible();
  });
});
