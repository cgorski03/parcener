import { test, expect } from '@/test/e2e/fixtures';

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
    test('User can add a Venmo account and remove it', async ({ page, authenticateAs }) => {
        // 1. Setup
        await authenticateAs();
        await page.goto('/account');

        // 2. Open Sheet
        await page.getByRole('button', { name: 'Link Venmo Account' }).click();

        // STEP B: Set up the listener (do not await it yet!)
        const popupPromise = page.waitForEvent('popup');
        // STEP A: Fill the input FIRST so the button appears
        // The button logic in your component relies on (cleanHandle.length > 2)
        await page.getByLabel('Venmo Username').fill('playwright_user');


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
        page.on('dialog', dialog => dialog.accept());

        // Use a specific class selector (.group) from your component to ensure
        // we are targeting the list item, not a generic div wrapper.
        const row = page.locator('.group', { has: page.getByText('@playwright_user') });

        // Now there is truly only one button inside this row (the trash icon)
        await row.getByRole('button').click();

        await expect(page.getByText('No payment methods')).toBeVisible();
    });
});
