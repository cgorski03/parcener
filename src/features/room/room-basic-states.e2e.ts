import { expect, test } from '@/test/e2e/fixtures';
import { e2eDb } from '@/test/e2e/db';
import { createSuccessfulReceipt } from '@/test/factories/receipt';
import { createTestRoom, createTestRoomMember } from '@/test/factories/room';
import { createTestUser } from '@/test/factories/user';

test.describe('Room - Guest Flow', () => {
  test('unauthenticated guest can join room and cookie is set', async ({ page }) => {
    // Create a host user and room in the database (the guest won't be authenticated)
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

    // NOTE: No authenticateAs call - this is a true unauthenticated guest
    await page.goto(`/receipt/parce/${testRoom.id}`);

    // Should see the lobby with name input (since not authenticated)
    await expect(page.getByRole('button', { name: /join.*bill.*split/i })).toBeVisible();

    // Guest must enter their display name
    const displayNameInput = page.getByPlaceholder(/enter your name/i);
    await expect(displayNameInput).toBeVisible();
    await displayNameInput.fill('Anonymous Guest');

    // Join the room
    await page.getByRole('button', { name: /join.*bill.*split/i }).click();

    // After joining, should see the room content with items
    await expect(page.getByText('Burger')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Fries')).toBeVisible();

    // Verify the guest cookie was set
    const cookies = await page.context().cookies();
    const guestCookie = cookies.find(c => c.name === `guest_uuid_room_${testRoom.id}`);
    expect(guestCookie).toBeTruthy();
    expect(guestCookie?.value).toMatch(/^[a-f0-9-]+$/); // UUID format
  });

  test('guest can return to room and be recognized by cookie', async ({ page }) => {
    // Create room
    const hostUser = await createTestUser(e2eDb, { canUpload: true });
    const { receipt } = await createSuccessfulReceipt(
      hostUser.id,
      [{ interpretedText: 'Pizza', price: 20.0, quantity: 1 }],
      e2eDb,
    );
    const testRoom = await createTestRoom(e2eDb, receipt.id, hostUser.id, {
      title: 'Return Test Room',
    });

    // First visit - join as guest
    await page.goto(`/receipt/parce/${testRoom.id}`);
    await page.getByPlaceholder(/enter your name/i).fill('Returning Guest');
    await page.getByRole('button', { name: /join.*bill.*split/i }).click();
    await expect(page.getByText('Pizza')).toBeVisible({ timeout: 5000 });

    // Navigate away
    await page.goto('/');

    // Return to room - should NOT see lobby, should go directly to room
    await page.goto(`/receipt/parce/${testRoom.id}`);

    // Should see items directly (not the lobby)
    await expect(page.getByText('Pizza')).toBeVisible({ timeout: 5000 });

    // Should NOT see the "Join Bill Split" button since already a member
    await expect(page.getByRole('button', { name: /join.*bill.*split/i })).not.toBeVisible();
  });
});

test.describe('Room - Authenticated User Flow', () => {
  test('authenticated user can join room', async ({ page, authenticateAs }) => {
    // Create room by a different host
    const hostUser = await createTestUser(e2eDb, { canUpload: true });
    const { receipt } = await createSuccessfulReceipt(
      hostUser.id,
      [
        { interpretedText: 'Steak', price: 35.0, quantity: 1 },
        { interpretedText: 'Wine', price: 15.0, quantity: 1 },
      ],
      e2eDb,
    );
    const testRoom = await createTestRoom(e2eDb, receipt.id, hostUser.id, {
      title: 'Auth User Test Room',
    });

    // Authenticate as a different user who will join
    await authenticateAs({ name: 'John Doe' });

    await page.goto(`/receipt/parce/${testRoom.id}`);

    // Authenticated users see their name pre-filled and can join
    await expect(page.getByRole('button', { name: /join.*bill.*split/i })).toBeVisible();

    // Should see "Logged in" indicator for authenticated users
    await expect(page.getByText(/logged in/i)).toBeVisible();

    await page.getByRole('button', { name: /join.*bill.*split/i }).click();

    // Should see room items
    await expect(page.getByText('Steak')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Wine')).toBeVisible();
  });

  test('room host can view settlement', async ({ page, authenticateAsUploader }) => {
    // Create the room as the authenticated uploader (host)
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
    // Add the host as a room member
    await createTestRoomMember(e2eDb, testRoom.id, { userId: user.id });

    await page.goto(`/receipt/parce/${testRoom.id}`);

    // Should see items (host is already a member, no lobby)
    await expect(page.getByText('Pizza')).toBeVisible({ timeout: 5000 });

    // Click settlement button
    await page.getByRole('button', { name: /view.*settlement|settle/i }).click();

    // Should show settlement view - look for the "Your Share" heading specifically
    await expect(page.getByRole('heading', { name: 'Your Share' })).toBeVisible();
  });
});
