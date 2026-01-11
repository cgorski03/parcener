/**
 * Full Receipt-to-Settlement Flow Test
 *
 * This is a cross-feature integration test that validates the complete user journey:
 * 1. Upload receipt
 * 2. Wait for AI processing (mocked)
 * 3. Edit items (add/edit)
 * 4. Add tip
 * 5. Create room
 * 6. Join room as additional users
 * 7. Claim items
 * 8. View settlement
 *
 * Note: This test spans multiple features (upload-receipt, room, receipt-review).
 * For feature-scoped E2E tests, see the individual feature e2e files.
 */

import path from 'node:path';
import { setupReceiptForReviewSuccess } from '../helpers';
import { expect, test } from '@/test/e2e/fixtures';
import { e2eDb } from '@/test/e2e/db';
import { paymentMethod } from '@/shared/server/db/schema';

test.describe('Full Receipt to Settlement Flow', () => {
    test('completes full journey from upload to settlement', async ({
        page,
        authenticateAsUploader,
        authenticateAs,
    }) => {
        // ============================================
        // ACT 1: Upload Receipt
        // ============================================

        const { user: uploader } = await authenticateAsUploader();

        await e2eDb.insert(paymentMethod).values({
            userId: uploader.id,
            type: 'venmo',
            handle: '@uploader-venmo',
            isDefault: true,
        });

        await page.goto('/upload');

        await page.waitForTimeout(1000);
        await expect(page.getByText('Split a Receipt')).toBeVisible();

        const fileInput = page.locator('#receipt');
        const testImagePath = path.join(
            process.cwd(),
            'public/test-images/valid-receipt.jpg',
        );
        await fileInput.setInputFiles(testImagePath);

        await expect(page.getByText('valid-receipt.jpg')).toBeVisible();

        const uploadButton = page.getByRole('button', {
            name: 'Process Receipt',
        });
        await expect(uploadButton).toBeEnabled();
        await uploadButton.click();

        // Seed the payment method so it will be available when making the room

        const items = [
            { interpretedText: 'Burger', price: 15.0, quantity: 1 },
            { interpretedText: 'Fries', price: 5.0, quantity: 1 },
            { interpretedText: 'Soda', price: 3.0, quantity: 1 },
        ];

        await setupReceiptForReviewSuccess({ items, db: e2eDb, page });

        await expect(page.getByText('Burger')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Fries')).toBeVisible();
        await expect(page.getByText('Soda')).toBeVisible();

        // ============================================
        // ACT 3: Edit Receipt Totals (Add Tip)
        // ============================================

        // Click on the "Receipt Totals" section to open the edit sheet
        await page.getByRole('heading', { name: 'Receipt Totals' }).click();
        await expect(page.getByText('Edit Totals')).toBeVisible();

        // The tip input is type="number" - find the second one (first is tax)
        const tipInput = page.locator('input[type="number"]').nth(1);
        await expect(tipInput).toBeVisible();
        await tipInput.fill('10');

        const saveButton = page.getByRole('button', { name: 'Save' });
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        await expect(page.getByText('Edit Totals')).not.toBeVisible({
            timeout: 5000,
        });
        await expect(page.locator('text=/\\$33\\.00/i')).toHaveCount(2);

        // ============================================
        // ACT 4: Create Room
        // ============================================

        const createRoomButton = page.getByRole('button', {
            name: 'Create Room',
        });
        await expect(createRoomButton).toBeVisible();
        await createRoomButton.click();

        await expect(
            page.getByRole('heading', { name: 'Create Room' }),
        ).toBeVisible();

        await page.getByRole('button', { name: 'Create Room' }).click();

        await expect(page).toHaveURL(/\/receipt\/parce\/[a-f0-9-]+/);

        const roomUrlMatch = page.url().match(/\/receipt\/parce\/([a-f0-9-]+)/);
        const roomId = roomUrlMatch ? roomUrlMatch[1] : null;
        expect(roomId).toBeTruthy();

        if (!roomId) throw new Error('Could not extract roomId from URL');

        // ============================================
        // ACT 5: Add Users to Room
        // ============================================

        const user2Response = await authenticateAs({
            name: 'User 2',
        });

        const user2 = user2Response.user;

        await e2eDb.insert(paymentMethod).values({
            userId: user2.id,
            type: 'venmo',
            handle: '@user2-venmo',
            isDefault: true,
        });

        await page.goto(`/receipt/parce/${roomId}`);

        const joinRoomButton = page.getByRole('button', { name: /join.*Split/i });
        await expect(joinRoomButton).toBeVisible({ timeout: 5000 });
        await joinRoomButton.click();

        await expect(page.getByText('User 2')).toBeVisible();

        // ============================================
        // ACT 6: Claim Items
        // ============================================

        const burgerItem = page.getByText('Burger').first();
        await burgerItem.click();

        const friesItem = page.getByText('Fries').first();
        await friesItem.click();

        // ============================================
        // ACT 7: View Settlement
        // ============================================

        await page.getByRole('button', { name: /Settle/i }).click();

        await expect(page.getByText('Settlement')).toBeVisible();

        await expect(page.locator('text=/\\$20\\.00/').first()).toBeVisible();
        await expect(page.locator('text=/\\$28\\.70/').first()).toBeVisible();
    });
});
