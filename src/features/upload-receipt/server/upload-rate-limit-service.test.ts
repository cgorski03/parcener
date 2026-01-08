import { describe, it, expect } from 'vitest';
import { createTestUser } from '@/test/factories';
import { receipt } from '@/shared/server/db';
import { getUserUploadRateLimit } from '@/features/upload-receipt/server/upload-rate-limit-service';
import { testDb } from '@/test/setup';

describe('getUserUploadRateLimit', () => {
  it('returns false for user without upload permission', async () => {
    const user = await createTestUser({ canUpload: false });

    const result = await getUserUploadRateLimit(testDb, user);

    expect(result.canUpload).toBe(false);
    expect(result.used).toBe(0);
    expect(result.limit).toBe(3);
  });

  it('returns true for user with 0 uploads today', async () => {
    const user = await createTestUser({ canUpload: true });

    const result = await getUserUploadRateLimit(testDb, user);

    expect(result.canUpload).toBe(true);
    expect(result.used).toBe(0);
    expect(result.limit).toBe(3);
  });

  it('returns true when uploads are below daily limit', async () => {
    const user = await createTestUser({ canUpload: true });

    await testDb.insert(receipt).values({
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date(),
    });

    const result = await getUserUploadRateLimit(testDb, user);

    expect(result.canUpload).toBe(true);
    expect(result.used).toBe(1);
    expect(result.limit).toBe(3);
  });

  it('returns false when user reaches daily limit', async () => {
    const user = await createTestUser({ canUpload: true });

    await testDb.insert(receipt).values([
      { id: crypto.randomUUID(), userId: user.id, createdAt: new Date() },
      { id: crypto.randomUUID(), userId: user.id, createdAt: new Date() },
      { id: crypto.randomUUID(), userId: user.id, createdAt: new Date() },
    ]);

    const result = await getUserUploadRateLimit(testDb, user);

    expect(result.canUpload).toBe(false);
    expect(result.used).toBe(3);
    expect(result.limit).toBe(3);
  });

  it('only counts uploads from today (UTC)', async () => {
    const user = await createTestUser({ canUpload: true });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(yesterday.getHours() - 24);

    await testDb.insert(receipt).values([
      { id: crypto.randomUUID(), userId: user.id, createdAt: yesterday },
      { id: crypto.randomUUID(), userId: user.id, createdAt: new Date() },
    ]);

    const result = await getUserUploadRateLimit(testDb, user);

    expect(result.canUpload).toBe(true);
    expect(result.used).toBe(1);
    expect(result.limit).toBe(3);
  });

  it('excludes uploads from other users', async () => {
    const user1 = await createTestUser({ canUpload: true });
    const user2 = await createTestUser({ canUpload: true });

    await testDb.insert(receipt).values({
      id: crypto.randomUUID(),
      userId: user2.id,
      createdAt: new Date(),
    });

    const result = await getUserUploadRateLimit(testDb, user1);

    expect(result.canUpload).toBe(true);
    expect(result.used).toBe(0);
    expect(result.limit).toBe(3);
  });
});
