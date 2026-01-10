import { expect, test } from '@/test/e2e/fixtures';
import { e2eDb } from '@/test/e2e/db';
import { invite } from '@/shared/server/db/schema';

test.describe('Invitation System', () => {

    test('Uploader creates invite, restricted user accepts and can upload', async ({
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

        // 5. Accept invite
        await page.goto(clipboardText);
        await expect(page.getByText('Welcome Aboard!')).toBeVisible();

        // 6. Navigate to upload and verify they can actually upload
        await page.getByRole('link', { name: 'Start Uploading' }).click();
        await expect(page).toHaveURL('/upload');

        // Should see the upload UI, NOT the restricted view
        await expect(page.getByText('Split a Receipt')).toBeVisible();
        await expect(page.getByText('Invitation Required')).not.toBeVisible();
    });

    test('Already authorized user sees "Already Authorized" message', async ({
        page,
        authenticateAsUploader,
    }) => {
        // 1. Create invite as uploader
        const { user } = await authenticateAsUploader();

        // Create invite directly in DB
        const [createdInvite] = await e2eDb
            .insert(invite)
            .values({ createdBy: user.id })
            .returning();

        // 2. Visit invite link (same user who already has upload access)
        await page.goto(`/acceptInvite?token=${createdInvite.id}`);

        // 3. Should see "Already Authorized"
        await expect(page.getByText('Already Authorized')).toBeVisible();
        await expect(page.getByText('You already have permission to upload receipts.')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Go to Account' })).toBeVisible();
    });

    test('Invalid token shows "Invalid Invitation" message', async ({
        page,
        authenticateAsRestrictedUser,
    }) => {
        await authenticateAsRestrictedUser();

        // Use a valid UUID format but non-existent token
        await page.goto('/acceptInvite?token=00000000-0000-4000-8000-000000000000');

        await expect(page.getByText('Invalid Invitation')).toBeVisible();
        await expect(page.getByText('This invitation link is invalid, expired, or has already been used.')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Return Home' })).toBeVisible();
    });

});
