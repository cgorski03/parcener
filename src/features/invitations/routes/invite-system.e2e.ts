import { test, expect } from '@/test/e2e/fixtures';

test.describe('Invitation System', () => {

    test('Full Flow: Admin copies invite link, Restricted User accepts it', async ({
        page,
        context,
        authenticateAsUploader,
        authenticateAsRestrictedUser,
    }) => {
        // 1. Setup Permissions
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        // 2. Admin creates invite
        await authenticateAsUploader();
        await page.goto('/account');
        await page.getByRole('button', { name: 'Create an Invitation' }).click();
        await page.waitForEvent('popup');
        // 3. Copy Link using the new button
        // This uses the aria-label we just added
        await page.getByRole('button', { name: 'Copy invite link' }).click();

        // 4. Verify Clipboard
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText).toContain('/acceptInvite?token=');

        // 5. Switch User & Accept
        await context.clearCookies();
        await authenticateAsRestrictedUser();

        await page.goto(clipboardText);

        // 6. Assert Success
        await expect(page.getByText('Welcome Aboard!')).toBeVisible();
        await page.getByRole('button', { name: 'Start Uploading' }).click();
        await expect(page).toHaveURL('/upload');
    });

    test('Restricted users cannot create invites', async ({
        page,
        authenticateAsRestrictedUser,
    }) => {
        await authenticateAsRestrictedUser();
        await page.goto('/account');

        const inviteBtn = page.getByRole('button', { name: /Invites Locked/ });

        await expect(inviteBtn).toBeVisible();
        await expect(inviteBtn).toBeDisabled();

        // Ensure the "Create" text is NOT present
        await expect(page.getByRole('button', { name: 'Create an Invitation' })).not.toBeVisible();
    });

    test('Existing admins see "Already Authorized" when clicking invite link', async ({
        page,
        authenticateAsUploader: authenticateAsAdmin,
    }) => {
        // 1. Admin generates invite (reuse logic)
        await authenticateAsAdmin();
        await page.goto('/account');

        const inviteResponsePromise = page.waitForResponse(r => r.url().includes('createInviteRpc'));
        await page.getByRole('button', { name: 'Create an Invitation' }).click();
        const response = await inviteResponsePromise;
        const { inviteId } = await response.json();

        // 2. Admin visits the link (Same user session)
        await page.goto(`/acceptInvite?token=${inviteId}`);

        // 3. Assert "Already Authorized" state
        await expect(page.getByText('Already Authorized')).toBeVisible();
        await expect(page.getByText('You already have permission')).toBeVisible();

        // Check secondary button
        await expect(page.getByRole('button', { name: 'Go to Account' })).toBeVisible();
    });

    test('Handling invalid or malformed tokens', async ({
        page,
        authenticateAsRestrictedUser,
    }) => {
        await authenticateAsRestrictedUser();

        // Case A: Completely garbage token
        await page.goto('/acceptInvite?token=not-a-real-token');
        await expect(page.getByText('Invalid Invitation')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Return Home' })).toBeVisible();

        // Case B: No token
        await page.goto('/acceptInvite');
        // Depending on your implementation, this usually triggers Not Found or Error
        // Let's assume it hits "Something Went Wrong" or "Invalid" based on schema validation
        await expect(page.getByRole('alert').or(page.getByText(/Invalid|Wrong/))).toBeVisible();
    });

});
