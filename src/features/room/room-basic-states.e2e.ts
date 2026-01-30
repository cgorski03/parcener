import { expect, test } from '@/test/e2e/fixtures';
import { e2eDb } from '@/test/e2e/db';
import { createSuccessfulReceipt } from '@/test/factories/receipt';
import { createTestRoom, createTestRoomMember } from '@/test/factories/room';
import { createTestUser } from '@/test/factories/user';

test.describe('Room - Guest Flow', () => {
  test('unauthenticated guest can join room and cookie is set', async ({
    page,
  }) => {
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
    await expect(
      page.getByRole('button', { name: /join.*bill.*split/i }),
    ).toBeVisible();

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
    const guestCookie = cookies.find(
      (c) => c.name === `guest_uuid_room_${testRoom.id}`,
    );
    expect(guestCookie).toBeTruthy();
    expect(guestCookie?.value).toMatch(/^[a-f0-9-]+$/); // UUID format
  });

  test('guest can return to room and be recognized by cookie', async ({
    page,
  }) => {
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
    await expect(
      page.getByRole('button', { name: /join.*bill.*split/i }),
    ).not.toBeVisible();
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
    await expect(
      page.getByRole('button', { name: /join.*bill.*split/i }),
    ).toBeVisible();

    // Should see "Logged in" indicator for authenticated users
    await expect(page.getByText(/logged in/i)).toBeVisible();

    await page.getByRole('button', { name: /join.*bill.*split/i }).click();

    // Should see room items
    await expect(page.getByText('Steak')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Wine')).toBeVisible();
  });

  test('room host can view settlement', async ({
    page,
    authenticateAsUploader,
  }) => {
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
    await page
      .getByRole('button', { name: /view.*settlement|settle/i })
      .click();

    // Should show settlement view - look for the "Your Share" heading specifically
    await expect(
      page.getByRole('heading', { name: 'Your Share' }),
    ).toBeVisible();
  });
});

test.describe('Room - Host Actions', () => {
  test('host can navigate to edit receipt from dropdown', async ({
    page,
    authenticateAsUploader,
  }) => {
    const { user } = await authenticateAsUploader();

    const { receipt } = await createSuccessfulReceipt(
      user.id,
      [{ interpretedText: 'Burger', price: 15.0, quantity: 1 }],
      e2eDb,
    );
    const testRoom = await createTestRoom(e2eDb, receipt.id, user.id, {
      title: 'Edit Receipt Test',
    });
    await createTestRoomMember(e2eDb, testRoom.id, { userId: user.id });

    await page.goto(`/receipt/parce/${testRoom.id}`);
    await expect(page.getByText('Burger')).toBeVisible({ timeout: 5000 });

    // Open dropdown menu
    await page.getByRole('button', { name: /more/i }).click();

    // Click edit receipt
    await page.getByRole('menuitem', { name: /edit receipt/i }).click();

    // Should navigate to receipt review page
    await expect(page).toHaveURL(new RegExp(`/receipt/review/${receipt.id}`));
  });

  test('host can rename room from dropdown', async ({
    page,
    authenticateAsUploader,
  }) => {
    const { user } = await authenticateAsUploader();

    const { receipt } = await createSuccessfulReceipt(
      user.id,
      [{ interpretedText: 'Pizza', price: 20.0, quantity: 1 }],
      e2eDb,
    );
    const testRoom = await createTestRoom(e2eDb, receipt.id, user.id, {
      title: 'Original Title',
    });
    await createTestRoomMember(e2eDb, testRoom.id, { userId: user.id });

    await page.goto(`/receipt/parce/${testRoom.id}`);
    await expect(page.getByText('Pizza')).toBeVisible({ timeout: 5000 });

    // Verify original title is shown
    await expect(page.getByText('Original Title')).toBeVisible();

    // Open dropdown menu
    await page.getByRole('button', { name: /more/i }).click();

    // Click rename room
    await page.getByRole('menuitem', { name: /rename room/i }).click();

    // Dialog should open
    await expect(
      page.getByRole('heading', { name: /rename room/i }),
    ).toBeVisible();

    // Clear and type new title
    const input = page.getByRole('textbox');
    await input.clear();
    await input.fill('New Room Title');

    // Save
    await page.getByRole('button', { name: /save/i }).click();

    // Dialog should close and new title should be visible
    await expect(
      page.getByRole('heading', { name: /rename room/i }),
    ).not.toBeVisible();
    await expect(page.getByText('New Room Title')).toBeVisible();

    // Reload to verify persistence (not just optimistic update)
    await page.reload();
    await expect(page.getByText('New Room Title')).toBeVisible();
  });

  test('host can lock room from dropdown', async ({
    page,
    authenticateAsUploader,
  }) => {
    const { user } = await authenticateAsUploader();

    const { receipt } = await createSuccessfulReceipt(
      user.id,
      [{ interpretedText: 'Salad', price: 12.0, quantity: 1 }],
      e2eDb,
    );
    const testRoom = await createTestRoom(e2eDb, receipt.id, user.id, {
      title: 'Lock Test Room',
    });
    await createTestRoomMember(e2eDb, testRoom.id, { userId: user.id });

    await page.goto(`/receipt/parce/${testRoom.id}`);
    await expect(page.getByText('Salad')).toBeVisible({ timeout: 5000 });

    // Should see Invite button (room is unlocked)
    await expect(page.getByRole('button', { name: /invite/i })).toBeVisible();

    // Open dropdown menu
    await page.getByRole('button', { name: /more/i }).click();

    // Click lock room
    await page.getByRole('menuitem', { name: /lock room/i }).click();

    // Invite button should be replaced with Locked indicator
    await expect(page.getByText(/locked/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /invite/i }),
    ).not.toBeVisible();

    // Reload to verify persistence (not just optimistic update)
    await page.reload();
    await expect(page.getByText(/locked/i)).toBeVisible();
  });

  test('host can unlock room from dropdown', async ({
    page,
    authenticateAsUploader,
  }) => {
    const { user } = await authenticateAsUploader();

    const { receipt } = await createSuccessfulReceipt(
      user.id,
      [{ interpretedText: 'Soup', price: 8.0, quantity: 1 }],
      e2eDb,
    );
    const testRoom = await createTestRoom(e2eDb, receipt.id, user.id, {
      title: 'Unlock Test Room',
      status: 'locked',
    });
    await createTestRoomMember(e2eDb, testRoom.id, { userId: user.id });

    await page.goto(`/receipt/parce/${testRoom.id}`);
    await expect(page.getByText('Soup')).toBeVisible({ timeout: 5000 });

    // Should see Locked indicator (room is locked)
    await expect(page.getByText(/locked/i)).toBeVisible();

    // Open dropdown menu
    await page.getByRole('button', { name: /more/i }).click();

    // Click unlock room
    await page.getByRole('menuitem', { name: /unlock room/i }).click();

    // Invite button should reappear
    await expect(page.getByRole('button', { name: /invite/i })).toBeVisible();

    // Reload to verify persistence (not just optimistic update)
    await page.reload();
    await expect(page.getByRole('button', { name: /invite/i })).toBeVisible();
  });
});
