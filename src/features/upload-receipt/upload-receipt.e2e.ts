import path from 'node:path';
import { eq } from 'drizzle-orm';
import { expect, test } from '@/test/e2e/fixtures';
import { e2eDb } from '@/test/e2e/db';
import {
    paymentMethod,
    receipt,
    receiptItem,
    receiptProcessingInformation,
} from '@/shared/server/db/schema';
import { createSuccessfulReceipt } from '@/test/factories/receipt';

test.describe('Upload Receipt', () => {
    test.describe('Happy Path - Full Upload to Room Flow', () => {
        test('uploads receipt, processes it, edits items, and creates room', async ({
            page,
            authenticateAsUploader,
        }) => {
            // 1. Setup - Authenticate and create payment method
            const { user } = await authenticateAsUploader();

            // Add payment method for room creation
            await e2eDb.insert(paymentMethod).values({
                userId: user.id,
                type: 'venmo',
                handle: '@test-venmo',
                isDefault: true,
            });

            // 2. Navigate to upload page
            await page.goto('/upload');
            await expect(page.getByText('Split a Receipt')).toBeVisible();

            // 3. Upload valid receipt
            const fileInput = page.locator('input[type="file"]');
            const testImagePath = path.join(
                process.cwd(),
                'public/test-images/valid-receipt.jpg',
            );

            await fileInput.setInputFiles(testImagePath);

            // Verify preview appears
            await expect(page.getByText('valid-receipt.jpg')).toBeVisible();
            await expect(page.getByText('134B')).toBeVisible();

            // 4. Submit for processing
            const uploadButton = page.getByRole('button', {
                name: 'Process Receipt',
            });
            await expect(uploadButton).toBeEnabled();
            await uploadButton.click();

            // 5. Wait for navigation to review page
            await expect(page).toHaveURL(/\/receipt\/review\/[a-f0-9-]+/);

            // Extract receiptId from URL
            const urlMatch = page.url().match(/\/receipt\/review\/([a-f0-9-]{36})/);
            const receiptId = urlMatch ? urlMatch[1] : null;
            expect(receiptId).toBeTruthy();

            if (!receiptId) throw new Error('Could not extract receiptId from URL');

            // 6. Mock: Update processing info to processing status
            await e2eDb.insert(receiptProcessingInformation).values({
                receiptId,
                processingStatus: 'processing',
                startedAt: new Date(),
            });

            // Wait for processing view
            await expect(page.getByText('Processing your receipt')).toBeVisible();

            // 7. Mock: Update receipt to success with items
            const { receipt: updatedReceipt, items } = await createSuccessfulReceipt(
                user.id,
                [
                    { interpretedText: 'Coffee', price: 4.5, quantity: 1 },
                    { interpretedText: 'Sandwich', price: 12.0, quantity: 1 },
                ],
                e2eDb,
            );

            // Update receipt in DB with new data
            await e2eDb
                .update(receipt)
                .set({
                    subtotal: updatedReceipt.subtotal,
                    grandTotal: updatedReceipt.grandTotal,
                })
                .where(eq(receipt.id, receiptId));

            // Delete old items and add new ones
            await e2eDb
                .delete(receiptItem)
                .where(eq(receiptItem.receiptId, receiptId));
            for (const item of items) {
                await e2eDb.insert(receiptItem).values({
                    ...item,
                    receiptId,
                });
            }

            // Update processing info to success
            await e2eDb
                .update(receiptProcessingInformation)
                .set({
                    processingStatus: 'success',
                    endedAt: new Date(),
                })
                .where(eq(receiptProcessingInformation.receiptId, receiptId));

            // 8. Wait for editor view to load (polling will pick up the change)
            await expect(page.getByText('Coffee')).toBeVisible({ timeout: 10000 });
            await expect(page.getByText('Sandwich')).toBeVisible();

            // 9. Verify totals
            await expect(page.getByText('$16.50')).toBeVisible(); // subtotal

            // 10. Click "Create Room" button
            const createRoomButton = page.getByRole('button', {
                name: 'Create Room',
            });
            await expect(createRoomButton).toBeVisible();
            await createRoomButton.click();

            // 11. Verify room creation sheet opens
            await expect(page.getByText('Create Room')).toBeVisible();

            // 12. Confirm room creation
            await page.getByRole('button', { name: 'Create Room & Share' }).click();

            // 13. Verify redirect to room page
            await expect(page).toHaveURL(/\/receipt\/parce\/[a-f0-9-]+/);
            await expect(page.getByText('Room created!')).toBeVisible();
        });
    });

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
                page.getByText('You need an invitation to upload receipts'),
            ).toBeVisible();

            // 4. Verify link to invitations
            const inviteLink = page.getByRole('link', { name: /Get Invitation/i });
            await expect(inviteLink).toBeVisible();
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
                await createSuccessfulReceipt(
                    user.id,
                    [{ interpretedText: `Item ${i}`, price: 10 }],
                    e2eDb,
                );
            }

            // 3. Navigate to upload page
            await page.goto('/upload');

            // 4. Verify rate limit message
            await expect(page.getByText('Daily Limit Reached')).toBeVisible();
            await expect(
                page.getByText(/You've used your 3 uploads for today/),
            ).toBeVisible();

            // 5. Verify no upload form shown
            await expect(page.getByText('Split a Receipt')).not.toBeVisible();
            await expect(page.locator('input[type="file"]')).not.toBeVisible();
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

            // 2. Try to upload PDF file
            const fileInput = page.locator('input[type="file"]');
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

            // 2. Try to upload large file (>5MB)
            const fileInput = page.locator('input[type="file"]');
            const largeFilePath = path.join(
                process.cwd(),
                'public/test-images/large-receipt.jpg',
            );

            await fileInput.setInputFiles(largeFilePath);

            // 3. Verify error message with file size
            await expect(page.getByText('File too large')).toBeVisible();
            await expect(page.getByText(/6\.00 MB/)).toBeVisible();
            await expect(page.getByText(/Max 5\.00 MB/)).toBeVisible();

            // 4. Verify no file preview shown
            await expect(page.getByText('large-receipt.jpg')).not.toBeVisible();
        });
    });

    test.describe('Failed Processing Status', () => {
        test('shows error view when processing fails', async ({
            page,
            authenticateAsUploader,
        }) => {
            // 1. Authenticate and navigate
            await authenticateAsUploader();
            await page.goto('/upload');

            // 2. Upload valid receipt
            const fileInput = page.locator('input[type="file"]');
            const testImagePath = path.join(
                process.cwd(),
                'public/test-images/valid-receipt.jpg',
            );
            await fileInput.setInputFiles(testImagePath);

            // 3. Submit for processing
            await page.getByRole('button', { name: 'Process Receipt' }).click();

            // 4. Extract receiptId from URL
            const urlMatch = page.url().match(/\/receipt\/review\/([a-f0-9-]+)/);
            const receiptId = urlMatch ? urlMatch[1] : null;
            expect(receiptId).toBeTruthy();

            if (!receiptId) throw new Error('Could not extract receiptId from URL');

            // 5. Mock: Set receipt to failed status
            await e2eDb.insert(receiptProcessingInformation).values({
                receiptId,
                processingStatus: 'failed',
                startedAt: new Date(),
                endedAt: new Date(),
            });

            // 6. Wait for failed view to appear
            await expect(page.getByText('Processing Failed')).toBeVisible({
                timeout: 10000,
            });

            // 7. Verify error details and retry option
            await expect(
                page.getByText(/We couldn't process your receipt/),
            ).toBeVisible();
            await expect(
                page.getByRole('button', { name: 'Try Again' }),
            ).toBeVisible();
        });
    });
});
