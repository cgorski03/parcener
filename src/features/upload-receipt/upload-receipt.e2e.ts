import path from 'node:path';
import { expect, test } from '@/test/e2e/fixtures';
import { e2eDb } from '@/test/e2e/db';
import { paymentMethod } from '@/shared/server/db/schema';

test.describe('Upload Receipt', () => {
  test.describe('Restricted User - No Upload Access', () => {
    test('shows invitation required message for restricted users', async ({
      page,
      authenticateAsRestrictedUser,
    }) => {
      // 1. Authenticate as restricted user
      await authenticateAsRestrictedUser();

      // 2. Navigate to upload page
      await page.goto('/upload');

      // 3. Verify restricted view
      await expect(page.getByText('Invitation Required')).toBeVisible();
      await expect(
        page.getByText('This feature is currently invite-only.'),
      ).toBeVisible();

      // 4. Verify link text mentions asking a friend for link
      await expect(
        page.getByText('Ask a friend already using Parcener for a'),
      ).toBeVisible();
    });
  });

  test.describe('Rate Limit Exceeded', () => {
    test('shows rate limit message when daily limit reached', async ({
      page,
      authenticateAsUploader,
    }) => {
      // 1. Authenticate as uploader
      const { user } = await authenticateAsUploader();

      // 2. Create 3 existing receipts (daily limit = 3)
      for (let i = 0; i < 3; i++) {
        await e2eDb.insert(paymentMethod).values({
          userId: user.id,
          type: 'venmo',
          handle: `@user${i}-venmo`,
          isDefault: true,
        });
        await e2eDb.insert(paymentMethod).values({
          userId: user.id,
          type: 'venmo',
          handle: `@user${i}-venmo`,
          isDefault: false,
        });
      }

      // 3. Navigate to upload page
      await page.goto('/upload');
      await page.waitForTimeout(500);

      // 4. Verify rate limit message
      await expect(page.getByText('You have used all')).toBeVisible();
    });
  });

  test.describe('File Validation - Invalid Type', () => {
    test('shows error for invalid file type (PDF)', async ({
      page,
      authenticateAsUploader,
    }) => {
      // 1. Authenticate and navigate
      await authenticateAsUploader();
      await page.goto('/upload');

      // Wait for upload form to be visible
      await expect(page.getByText('Split a Receipt')).toBeVisible();

      // 2. Try to upload PDF file
      const fileInput = page.locator('#receipt');
      const testPdfPath = path.join(
        process.cwd(),
        'public/test-images/invalid.pdf',
      );

      await fileInput.setInputFiles(testPdfPath);

      // 3. Verify error message
      await expect(page.getByText('Invalid file type')).toBeVisible();
      await expect(
        page.getByText('Please use JPG, PNG, or HEIC.'),
      ).toBeVisible();

      // 4. Verify no file preview shown
      await expect(page.getByText('invalid.pdf')).not.toBeVisible();
    });
  });

  test.describe('File Validation - File Too Large', () => {
    test('shows error for file exceeding 5MB limit', async ({
      page,
      authenticateAsUploader,
    }) => {
      // 1. Authenticate and navigate
      await authenticateAsUploader();
      await page.goto('/upload');

      // Wait for upload form to be visible
      await expect(page.getByText('Split a Receipt')).toBeVisible();

      // 2. Try to upload large file (>5MB)
      const fileInput = page.locator('#receipt');
      const largeFilePath = path.join(
        process.cwd(),
        'public/test-images/large-receipt.jpg',
      );

      await fileInput.setInputFiles(largeFilePath);

      // 3. Verify error message with file size
      // Wait for validation to run and UI to update
      await page.waitForTimeout(500);
      await expect(page.getByText(/File too large.*Max.*MB/i)).toBeVisible();

      // 4. Verify no file preview shown
      await expect(page.getByText('large-receipt.jpg')).not.toBeVisible();
    });
  });
});
