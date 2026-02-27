import fs from 'node:fs';
import path from 'node:path';
import { setupReceiptForReviewSuccess } from '../helpers';
import { e2eDb } from '@/test/e2e/db';
import { expect, test } from '@/test/e2e/fixtures';

test.describe('Receipt Review Image View', () => {
  test('shows receipt image view and item drawer actions', async ({
    page,
    authenticateAsUploader,
  }) => {
    await authenticateAsUploader();

    await page.goto('/upload');
    await expect(page.getByText('Split a Receipt')).toBeVisible();

    const fileInput = page.locator('#receipt');
    const testImagePath = path.join(
      process.cwd(),
      'src/test/fixtures/valid-receipt.jpg',
    );
    await fileInput.setInputFiles(testImagePath);

    await expect(page.getByText('valid-receipt.jpg')).toBeVisible();

    await page
      .getByRole('button', { name: 'Process Receipt' })
      .click();

    const items = [
      { interpretedText: 'Burger', price: 15.0, quantity: 1 },
      { interpretedText: 'Fries', price: 5.0, quantity: 1 },
      { interpretedText: 'Soda', price: 3.0, quantity: 1 },
    ];

    await setupReceiptForReviewSuccess({ items, db: e2eDb, page });

    await expect(page.getByText('Burger')).toBeVisible({ timeout: 10000 });

    const imageFixturePath = path.join(
      process.cwd(),
      'src/test/fixtures/receipt-image.png',
    );
    const imageFixture = fs.readFileSync(imageFixturePath);
    await page.route(/\/api\/receipt-image\/receipt\/[a-f0-9-]+/, (route) =>
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'image/png' },
        body: imageFixture,
      }),
    );

    await page.getByRole('link', { name: 'Image' }).click();
    await expect(page).toHaveURL(/view=image/);

    const receiptImage = page.locator('img[alt="Receipt image"]');
    await expect(receiptImage).toBeVisible();
    await expect(receiptImage).toHaveAttribute(
      'src',
      /\/api\/receipt-image\/receipt\//,
    );

    const itemsDrawer = page.getByTestId('receipt-image-items-drawer');
    await expect(itemsDrawer.getByRole('button', { name: 'Add' })).toBeVisible();
    await expect(itemsDrawer.getByText('3 items')).toBeVisible();

    await page.getByText('Burger').first().click();
    await expect(page.getByText('Edit Item')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Edit Item')).not.toBeVisible();

    await page.getByRole('button', { name: 'Expand Image' }).click();
    await expect(page.getByRole('button', { name: 'Add' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Exit Fullscreen' }).click();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();

    await page.getByRole('link', { name: 'Items' }).click();
    await expect(page).toHaveURL(/view=items/);
    await expect(
      page.getByRole('button', { name: 'Add Custom Item' }),
    ).toBeVisible();
  });
});
