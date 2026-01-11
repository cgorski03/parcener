import { expect, test } from '@/test/e2e/fixtures';
import { e2eDb } from '@/test/e2e/db';
import { createSuccessfulReceipt } from '@/test/factories/receipt';
import { createTestRoom, createTestRoomMember } from '@/test/factories/room';
import { createTestUser } from '@/test/factories/user';

test.describe('Room - Basic States', () => {
  test('guest can join room via lobby', async ({ page, authenticateAs }) => {
    // Create a host user and a room in the database
    const hostUser = await createTestUser(e2eDb, { canUpload: true });
    const { receipt } = await createSuccessfulReceipt(
      hostUser.id,
      [
        { interpretedText: 'Burger', price: 15.0, quantity: 1 },
        { interpretedText: 'Fries', price: 5.0, quantity: 1 },
      ],
      e2eDb,
    );
    const testRoom = await createTestRoom(e2eDb, receipt.id, hostUser.id, {
      title: 'Test Room',
    });

    // Authenticate as a different user (the joiner)
    await authenticateAs({ name: 'Guest User' });

    await page.goto(`/receipt/parce/${testRoom.id}`);

    // Should see the lobby with "Join Bill Split" button
    await expect(page.getByRole('button', { name: /join.*bill.*split/i })).toBeVisible();

    // Fill in display name (for guest flow, though authenticated users may not need this)
    const displayNameInput = page.getByPlaceholder(/enter your name/i);
    if (await displayNameInput.isVisible()) {
      await displayNameInput.fill('Guest User');
    }

    const joinButton = page.getByRole('button', { name: /join.*bill.*split/i });
    await joinButton.click();

    // After joining, should see the room content with items
    await expect(page.getByText('Burger')).toBeVisible({ timeout: 5000 });
  });

  test('room shows settlement view', async ({ page, authenticateAsUploader }) => {
    // Create the room host
    const { user } = await authenticateAsUploader();

    const { receipt } = await createSuccessfulReceipt(
      user.id,
      [
        { interpretedText: 'Pizza', price: 20.0, quantity: 1 },
        { interpretedText: 'Salad', price: 10.0, quantity: 1 },
      ],
      e2eDb,
    );
    const testRoom = await createTestRoom(e2eDb, receipt.id, user.id, {
      title: 'Settlement Test Room',
    });
    // Add the user as a room member
    await createTestRoomMember(e2eDb, testRoom.id, { userId: user.id });

    await page.goto(`/receipt/parce/${testRoom.id}`);

    // Should see items after loading
    await expect(page.getByText('Pizza')).toBeVisible({ timeout: 5000 });

    // Click settlement button
    await page.getByRole('button', { name: /view.*settlement|settle/i }).click();

    // Should show settlement view
    await expect(page.getByText(/your.*share|settlement/i)).toBeVisible();
  });
});
