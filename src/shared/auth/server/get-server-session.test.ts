import { describe, expect, it, vi } from 'vitest';
import { getServerSession } from './get-server-session';

describe('get-server-session', () => {
  describe('getServerSession', () => {
    it('calls auth.api.getSession with headers', async () => {
      const mockAuth = {
        api: {
          getSession: vi.fn().mockResolvedValue({ user: { id: 'user123' } }),
        },
      } as any;

      const req = new Request('http://localhost', {
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await getServerSession(req, mockAuth);

      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: req.headers,
      });
      expect(result).toEqual({ user: { id: 'user123' } });
    });

    it('returns null when session is not found', async () => {
      const mockAuth = {
        api: {
          getSession: vi.fn().mockResolvedValue(null),
        },
      } as any;

      const req = new Request('http://localhost');

      const result = await getServerSession(req, mockAuth);

      expect(result).toBeNull();
    });

    it('passes headers through to auth API', async () => {
      const mockAuth = {
        api: {
          getSession: vi.fn().mockResolvedValue({ user: { id: 'user123' } }),
        },
      } as any;

      const req = new Request('http://localhost', {
        headers: {
          Authorization: 'Bearer token123',
          Cookie: 'session=abc',
        },
      });

      await getServerSession(req, mockAuth);

      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: req.headers,
      });
    });
  });
});
