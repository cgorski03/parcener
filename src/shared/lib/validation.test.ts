import { describe, expect, it } from 'vitest';
import { validateInviteSearch } from './validation';

describe('validation', () => {
  describe('validateInviteSearch', () => {
    it('returns valid token for valid UUID', () => {
      const search = { token: '550e8400-e29b-41d4-a716-446655440000' };

      const result = validateInviteSearch(search);

      expect(result).toEqual(search);
    });

    it('lowercases the token', () => {
      const search = { token: '550E8400-E29B-41D4-A716-446655440000' };

      const result = validateInviteSearch(search);

      expect(result.token).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('throws error for invalid UUID format', () => {
      const search = { token: 'not-a-uuid' };

      expect(() => validateInviteSearch(search)).toThrow(
        'Invalid Invite Token',
      );
    });

    it('throws error for invalid UUID version', () => {
      const search = { token: '00000000-0000-0000-0000-000000000001' };

      expect(() => validateInviteSearch(search)).toThrow(
        'Invalid Invite Token',
      );
    });

    it('throws error for malformed UUID', () => {
      const search = { token: '550e8400e29b-41d4-a716-446655440' };

      expect(() => validateInviteSearch(search)).toThrow(
        'Invalid Invite Token',
      );
    });

    it('throws error for empty token', () => {
      const search = { token: '' };

      expect(() => validateInviteSearch(search)).toThrow(
        'Invalid Invite Token',
      );
    });

    it('throws error when token is not string', () => {
      const search = { token: 123 as unknown as string };

      expect(() => validateInviteSearch(search)).toThrow(
        'Invalid Invite Token',
      );
    });

    it('handles valid UUID v4 with zeros', () => {
      const search = { token: '00000000-0000-4000-8000-000000000000' };

      const result = validateInviteSearch(search);

      expect(result).toEqual(search);
    });
  });
});
