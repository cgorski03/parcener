import { expect, test } from '@/test/e2e/fixtures';

test.describe('Payment Methods', () => {
  test('shows empty state when no payment methods', async ({
    page,
    authenticateAs,
  }) => {
    await authenticateAs();
    await page.goto('/account');

    await expect(page.getByText('No payment methods')).toBeVisible();
    await expect(
      page.getByText('Link an account so friends can easily pay you back.'),
    ).toBeVisible();
  });
  test('User can add a Venmo account and remove it', async ({
    page,
    authenticateAs,
  }) => {
    // 1. Setup
    await authenticateAs();
    await page.goto('/account');

    // 2. Open Sheet
    const linkButton = page.getByRole('button', { name: 'Link Venmo Account' });
    await expect(linkButton).toBeEnabled();
    await linkButton.click();

    // Wait for the sheet dialog to be visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });

    // STEP B: Set up the listener (do not await it yet!)
    const popupPromise = page.waitForEvent('popup');

    // Wait for input to be ready (component has 200ms delay)
    const input = page.getByLabel('Venmo Username');
    await expect(input).toBeVisible();
    await input.fill('playwright_user');

    // STEP C: Trigger the event
    // Now we click the button while the listener is active
    await page.getByRole('button', { name: 'Check @playwright_user' }).click();

    // STEP D: Now wait for the popup to be captured
    const popup = await popupPromise;

    // Validate and close popup
    await expect(popup).toHaveURL(/venmo\.com/);
    await popup.close();
    await page.getByRole('button', { name: 'Confirm & Save' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 3. Verify it appears in the list
    await expect(page.getByText('@playwright_user')).toBeVisible();

    // 4. Delete Method
    page.on('dialog', (dialog) => dialog.accept());

    // Use a specific class selector (.group) from your component to ensure
    // we are targeting the list item, not a generic div wrapper.
    const row = page.locator('.group', {
      has: page.getByText('@playwright_user'),
    });

    // Now there is truly only one button inside this row (the trash icon)
    await row.getByRole('button').click();

    await expect(page.getByText('No payment methods')).toBeVisible();
  });
});
