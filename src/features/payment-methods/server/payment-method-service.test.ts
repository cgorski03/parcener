import { describe, it, expect } from 'vitest';
import { testDb } from '@/test/setup';
import { createTestUser } from '@/test/factories/user';
import { paymentMethod } from '@/shared/server/db/schema';
import { eq } from 'drizzle-orm';
import {
  getUserPaymentMethods,
  createUserPaymentMethod,
  deleteUserPaymentMethod,
  getPaymentMethodSecure,
} from './payment-method-service';

describe('payment-method-service', () => {
  describe('getUserPaymentMethods', () => {
    it('returns empty array when user has no payment methods', async () => {
      const user = await createTestUser();

      const methods = await getUserPaymentMethods(testDb, user);

      expect(methods).toEqual([]);
    });

    it('returns user payment methods', async () => {
      const user = await createTestUser();

      await testDb.insert(paymentMethod).values({
        userId: user.id,
        type: 'venmo',
        handle: '@test-user',
        isDefault: true,
      });

      const methods = await getUserPaymentMethods(testDb, user);

      expect(methods).toHaveLength(1);
      expect(methods[0].type).toBe('venmo');
      expect(methods[0].handle).toBe('@test-user');
      expect(methods[0].isDefault).toBe(true);
    });

    it('only returns methods for requesting user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      await testDb.insert(paymentMethod).values({
        userId: user1.id,
        type: 'venmo',
        handle: '@user1',
        isDefault: true,
      });

      await testDb.insert(paymentMethod).values({
        userId: user2.id,
        type: 'venmo',
        handle: '@user2',
        isDefault: true,
      });

      const user1Methods = await getUserPaymentMethods(testDb, user1);
      const user2Methods = await getUserPaymentMethods(testDb, user2);

      expect(user1Methods).toHaveLength(1);
      expect(user1Methods[0].handle).toBe('@user1');
      expect(user2Methods).toHaveLength(1);
      expect(user2Methods[0].handle).toBe('@user2');
    });
  });

  describe('createUserPaymentMethod', () => {
    it('creates a new payment method', async () => {
      const user = await createTestUser();

      const result = await createUserPaymentMethod(testDb, user, {
        type: 'venmo',
        handle: '@venmo-user',
        isDefault: false,
      });

      expect(result.type).toBe('venmo');
      expect(result.handle).toBe('@venmo-user');
      expect(result.isDefault).toBe(false);
      expect(result.paymentMethodId).toBeDefined();
    });

    it('sets payment method as default when isDefault is true', async () => {
      const user = await createTestUser();

      const result = await createUserPaymentMethod(testDb, user, {
        type: 'venmo',
        handle: '@venmo-user',
        isDefault: true,
      });

      expect(result.isDefault).toBe(true);
    });

    it('unsets other payment methods when setting new default', async () => {
      const user = await createTestUser();

      await createUserPaymentMethod(testDb, user, {
        type: 'venmo',
        handle: '@first',
        isDefault: true,
      });

      await createUserPaymentMethod(testDb, user, {
        type: 'venmo',
        handle: '@second',
        isDefault: true,
      });

      const methods = await getUserPaymentMethods(testDb, user);
      const firstMethod = methods.find((m) => m.handle === '@first');
      const secondMethod = methods.find((m) => m.handle === '@second');

      expect(firstMethod?.isDefault).toBe(false);
      expect(secondMethod?.isDefault).toBe(true);
    });

    it('stores payment method in database', async () => {
      const user = await createTestUser();

      await createUserPaymentMethod(testDb, user, {
        type: 'venmo',
        handle: '@test-venmo',
        isDefault: false,
      });

      const stored = await testDb.query.paymentMethod.findFirst({
        where: eq(paymentMethod.userId, user.id),
      });

      expect(stored).toBeDefined();
      expect(stored?.type).toBe('venmo');
      expect(stored?.handle).toBe('@test-venmo');
    });
  });

  describe('deleteUserPaymentMethod', () => {
    it('deletes a payment method', async () => {
      const user = await createTestUser();

      const created = await createUserPaymentMethod(testDb, user, {
        type: 'venmo',
        handle: '@delete-me',
        isDefault: false,
      });

      await deleteUserPaymentMethod(testDb, user, created.paymentMethodId);

      const methods = await getUserPaymentMethods(testDb, user);
      expect(methods).toHaveLength(0);
    });

    it('only deletes payment method belonging to user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      await createUserPaymentMethod(testDb, user1, {
        type: 'venmo',
        handle: '@user1',
        isDefault: false,
      });

      const user2Method = await createUserPaymentMethod(testDb, user2, {
        type: 'venmo',
        handle: '@user2',
        isDefault: false,
      });

      await deleteUserPaymentMethod(testDb, user1, user2Method.paymentMethodId);

      const user1Methods = await getUserPaymentMethods(testDb, user1);
      const user2Methods = await getUserPaymentMethods(testDb, user2);

      expect(user1Methods).toHaveLength(1);
      expect(user2Methods).toHaveLength(1);
    });
  });

  describe('getPaymentMethodSecure', () => {
    it('returns payment method when it belongs to user', async () => {
      const user = await createTestUser();

      const created = await createUserPaymentMethod(testDb, user, {
        type: 'venmo',
        handle: '@secure-venmo',
        isDefault: false,
      });

      const result = await getPaymentMethodSecure(
        testDb,
        user.id,
        created.paymentMethodId,
      );

      expect(result).toBeDefined();
      expect(result?.type).toBe('venmo');
      expect(result?.handle).toBe('@secure-venmo');
    });

    it('returns undefined when payment method belongs to different user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      const user1Method = await createUserPaymentMethod(testDb, user1, {
        type: 'venmo',
        handle: '@user1',
        isDefault: false,
      });

      const result = await getPaymentMethodSecure(
        testDb,
        user2.id,
        user1Method.paymentMethodId,
      );

      expect(result).toBeUndefined();
    });

    it('returns undefined when payment method does not exist', async () => {
      const user = await createTestUser();

      const result = await getPaymentMethodSecure(
        testDb,
        user.id,
        '00000000-0000-0000-0000-000000000000',
      );

      expect(result).toBeUndefined();
    });
  });
});
