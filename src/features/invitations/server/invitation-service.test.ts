import { describe, it, expect } from 'vitest';
import { createTestUser } from '@/test/factories';
import { invite as inviteTable } from '@/shared/server/db';
import {
  getUserInviteRateLimit,
  createUploadInvitation,
  acceptInvitationToUpload,
  InviteError,
} from '@/features/invitations/server/invitation-service';
import { testDb } from '@/test/setup';

describe('getUserInviteRateLimit', () => {
  it('returns false for user without upload permission', async () => {
    const testUser = await createTestUser({ canUpload: false });

    const result = await getUserInviteRateLimit(testDb, testUser);

    expect(result.canInvite).toBe(false);
    expect(result.used).toBe(0);
    expect(result.limit).toBe(0);
  });

  it('returns true for user with 0 invites today', async () => {
    const testUser = await createTestUser({ canUpload: true });

    const result = await getUserInviteRateLimit(testDb, testUser);

    expect(result.canInvite).toBe(true);
    expect(result.used).toBe(0);
    expect(result.limit).toBe(3);
  });

  it('returns true when invites are below daily limit', async () => {
    const testUser = await createTestUser({ canUpload: true });

    await testDb.insert(inviteTable).values({
      id: crypto.randomUUID(),
      createdBy: testUser.id,
      createdAt: new Date(),
    });

    const result = await getUserInviteRateLimit(testDb, testUser);

    expect(result.canInvite).toBe(true);
    expect(result.used).toBe(1);
    expect(result.limit).toBe(3);
  });

  it('returns false when user reaches daily limit', async () => {
    const testUser = await createTestUser({ canUpload: true });

    await testDb.insert(inviteTable).values([
      {
        id: crypto.randomUUID(),
        createdBy: testUser.id,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        createdBy: testUser.id,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        createdBy: testUser.id,
        createdAt: new Date(),
      },
    ]);

    const result = await getUserInviteRateLimit(testDb, testUser);

    expect(result.canInvite).toBe(false);
    expect(result.used).toBe(3);
    expect(result.limit).toBe(3);
  });

  it('only counts invites from today (UTC)', async () => {
    const testUser = await createTestUser({ canUpload: true });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(yesterday.getHours() - 24);

    await testDb.insert(inviteTable).values([
      { id: crypto.randomUUID(), createdBy: testUser.id, createdAt: yesterday },
      {
        id: crypto.randomUUID(),
        createdBy: testUser.id,
        createdAt: new Date(),
      },
    ]);

    const result = await getUserInviteRateLimit(testDb, testUser);

    expect(result.canInvite).toBe(true);
    expect(result.used).toBe(1);
    expect(result.limit).toBe(3);
  });
});

describe('createUploadInvitation', () => {
  it('creates invitation successfully', async () => {
    const testUser = await createTestUser({ canUpload: true });

    const result = await createUploadInvitation(testDb, testUser);

    expect(result.inviteId).toBeDefined();
    expect(typeof result.inviteId).toBe('string');

    const inviteRecord = await testDb.query.invite.findFirst({
      where: (inviteTable, { eq }) => eq(inviteTable.id, result.inviteId),
    });

    expect(inviteRecord).toBeDefined();
    expect(inviteRecord!.createdBy).toBe(testUser.id);
  });

  it('throws RateLimitError when daily limit reached', async () => {
    const testUser = await createTestUser({ canUpload: true });

    await testDb.insert(inviteTable).values([
      {
        id: crypto.randomUUID(),
        createdBy: testUser.id,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        createdBy: testUser.id,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        createdBy: testUser.id,
        createdAt: new Date(),
      },
    ]);

    await expect(createUploadInvitation(testDb, testUser)).rejects.toThrow(
      'You have exceeded your daily invitation limit.',
    );
  });
});

describe('acceptInvitationToUpload', () => {
  it('claims invite and grants upload permission', async () => {
    const invitingUser = await createTestUser({ canUpload: true });
    const invitedUser = await createTestUser({ canUpload: false });

    const inviteRecord = await testDb
      .insert(inviteTable)
      .values({
        id: crypto.randomUUID(),
        createdBy: invitingUser.id,
        createdAt: new Date(),
      })
      .returning();

    const result = await acceptInvitationToUpload(
      testDb,
      invitedUser.id,
      inviteRecord[0]!.id,
    );

    expect(result.status).toBe('SUCCESS');

    const claimedInvite = await testDb.query.invite.findFirst({
      where: (inviteTable, { eq }) => eq(inviteTable.id, inviteRecord[0]!.id),
    });

    expect(claimedInvite).toBeDefined();
    expect(claimedInvite!.usedBy).toBe(invitedUser.id);
    expect(claimedInvite!.usedAt).not.toBeNull();

    const updatedUser = await testDb.query.user.findFirst({
      where: (userTable, { eq }) => eq(userTable.id, invitedUser.id),
      columns: { canUpload: true },
    });

    expect(updatedUser!.canUpload).toBe(true);
  });

  it('returns USER_ALREADY_AUTHORIZED if user already can upload', async () => {
    const invitingUser = await createTestUser({ canUpload: true });
    const authorizedUser = await createTestUser({ canUpload: true });

    const inviteRecord = await testDb
      .insert(inviteTable)
      .values({
        id: crypto.randomUUID(),
        createdBy: invitingUser.id,
        createdAt: new Date(),
      })
      .returning();

    const result = await acceptInvitationToUpload(
      testDb,
      authorizedUser.id,
      inviteRecord[0]!.id,
    );

    expect(result.status).toBe('USER_ALREADY_AUTHORIZED');
  });

  it('throws InviteError with NOT_FOUND if invite does not exist', async () => {
    const testUser = await createTestUser({ canUpload: false });

    await expect(
      acceptInvitationToUpload(testDb, testUser.id, crypto.randomUUID()),
    ).rejects.toThrow(InviteError);
  });

  it('throws InviteError with NOT_FOUND if invite already used', async () => {
    const invitingUser = await createTestUser({ canUpload: true });
    const invitedUser = await createTestUser({ canUpload: false });
    const someOtherUser = await createTestUser({ canUpload: true });

    const inviteRecord = await testDb
      .insert(inviteTable)
      .values({
        id: crypto.randomUUID(),
        createdBy: invitingUser.id,
        createdAt: new Date(),
        usedAt: new Date(),
        usedBy: someOtherUser.id,
      })
      .returning();

    await expect(
      acceptInvitationToUpload(testDb, invitedUser.id, inviteRecord[0]!.id),
    ).rejects.toThrow(InviteError);
  });
});
