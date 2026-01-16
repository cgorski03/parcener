/**
 * E2E Tests for Thinking Level Feature
 *
 * High-level smoke tests to ensure the thinking level slider
 * is functional and doesn't break the upload flow.
 */

import path from 'node:path';
import { expect, test } from '@/test/e2e/fixtures';

test.describe('Thinking Level Feature', () => {
  test('slider is visible and interactive on upload page', async ({
    page,
    authenticateAsUploader,
  }) => {
    await authenticateAsUploader();
    await page.goto('/upload');

    // Verify slider is visible with all options
    await expect(page.getByText('Processing Mode')).toBeVisible();
    await expect(page.getByText('Speed')).toBeVisible();
    await expect(page.getByText('Balanced')).toBeVisible();
    await expect(page.getByText('Precision')).toBeVisible();
    await expect(page.getByText('Recommended')).toBeVisible(); // Default state

    // Verify user can interact with slider
    await page.getByText('Speed').click();
    await expect(page.getByText('Fast processing')).toBeVisible();

    await page.getByText('Precision').click();
    await expect(page.getByText('Max accuracy')).toBeVisible();

    await page.getByText('Balanced').click();
    await expect(page.getByText('Recommended')).toBeVisible();
  });

  test('upload flow works with thinking level selected', async ({
    page,
    authenticateAsUploader,
  }) => {
    await authenticateAsUploader();
    await page.goto('/upload');

    // Select a thinking level
    await page.getByText('Precision').click();
    await expect(page.getByText('Max accuracy')).toBeVisible();

    // Upload a file
    const fileInput = page.locator('#receipt');
    const testImagePath = path.join(
      process.cwd(),
      'src/test/fixtures/valid-receipt.jpg',
    );
    await fileInput.setInputFiles(testImagePath);

    // Submit
    const uploadButton = page.getByRole('button', {
      name: 'Process Receipt',
    });
    await uploadButton.click();

    // Verify we get to the review page (upload succeeded)
    await expect(page).toHaveURL(/\/receipt\/review\/[a-f0-9-]+/);
  });
});
