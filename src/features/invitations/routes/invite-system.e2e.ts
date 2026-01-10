import { test, expect } from '@/test/e2e/fixtures';

test.describe('Invitation System', () => {

    test('Uploader creates invite, restricted user accepts and gains upload access', async ({
        page,
        context,
        authenticateAsUploader,
        authenticateAsRestrictedUser,
    }) => {
        // 1. Setup
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        // 2. Uploader creates invite
        await authenticateAsUploader();
        await page.goto('/account');

        await page.getByRole('button', { name: 'Create an Invitation' }).click();

        // 3. Wait for sheet and copy link
        const copyButton = page.getByRole('button', { name: 'Copy invite link' });
        await expect(copyButton).toBeVisible();
        await copyButton.click();

        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText).toContain('/acceptInvite?token=');

        // 4. Switch to restricted user
        await context.clearCookies();
        await authenticateAsRestrictedUser();

        // 5. Accept invite and verify access
        await page.goto(clipboardText);
        await expect(page.getByText('Welcome Aboard!')).toBeVisible();

        await page.getByRole('link', { name: 'Start Uploading' }).click();
        await expect(page).toHaveURL('/upload');
    });

});
