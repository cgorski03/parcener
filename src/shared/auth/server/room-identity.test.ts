import { describe, it, expect } from 'vitest';
import { parseRoomIdentity, type RoomIdentity } from './room-identity';

describe('room-identity', () => {
  describe('parseRoomIdentity', () => {
    it('returns user identity when user is authenticated', async () => {
      const req = new Request('http://localhost', {
        headers: { cookie: '' },
      });
      const user = { id: 'user123', name: 'Test User' } as any;
      const roomId = 'room456';

      const result = await parseRoomIdentity(req, roomId, user);

      expect(result).toEqual({
        userId: 'user123',
        name: 'Test User',
        guestUuid: undefined,
        isAuthenticated: true,
      });
    });

    it('returns guest identity when guest cookie is present', async () => {
      const guestUuid = '550e8400-e29b-41d4-a716-4466554400000';
      const req = new Request('http://localhost', {
        headers: { cookie: `guest_uuid_room_room456=${guestUuid}` },
      });
      const user = undefined;
      const roomId = 'room456';

      const result = await parseRoomIdentity(req, roomId, user);

      expect(result).toEqual({
        userId: undefined,
        name: undefined,
        guestUuid,
        isAuthenticated: false,
      });
    });

    it('returns both user and guest identity when both are present', async () => {
      const guestUuid = '550e8400-e29b-41d4-a716-4466554400000';
      const req = new Request('http://localhost', {
        headers: { cookie: `guest_uuid_room_room456=${guestUuid}` },
      });
      const user = { id: 'user123', name: 'Test User' } as any;
      const roomId = 'room456';

      const result = await parseRoomIdentity(req, roomId, user);

      expect(result).toEqual({
        userId: 'user123',
        name: 'Test User',
        guestUuid,
        isAuthenticated: true,
      });
    });

    it('returns null identity when neither user nor guest is present', async () => {
      const req = new Request('http://localhost', {
        headers: { cookie: '' },
      });
      const user = undefined;
      const roomId = 'room456';

      const result = await parseRoomIdentity(req, roomId, user);

      expect(result).toEqual({
        userId: undefined,
        name: undefined,
        guestUuid: undefined,
        isAuthenticated: false,
      });
    });

    it('lowercases guest UUID from cookie', async () => {
      const guestUuid = '550e8400-e29b-41d4-a716-4466554400000';
      const req = new Request('http://localhost', {
        headers: { cookie: `guest_uuid_room_room456=${guestUuid}` },
      });
      const user = undefined;
      const roomId = 'room456';

      const result = await parseRoomIdentity(req, roomId, user);

      expect(result.guestUuid).toBe('550e8400-e29b-41d4-a716-4466554400000');
    });

    it('extracts guest UUID from cookie string with other cookies', async () => {
      const guestUuid = '550e8400-e29b-41d4-a716-4466554400000';
      const req = new Request('http://localhost', {
        headers: {
          cookie: `other_cookie=value; guest_uuid_room_room456=${guestUuid}; another=value`,
        },
      });
      const user = undefined;
      const roomId = 'room456';

      const result = await parseRoomIdentity(req, roomId, user);

      expect(result.guestUuid).toBe(guestUuid);
    });

    it('handles missing cookie header gracefully', async () => {
      const req = new Request('http://localhost');
      const user = undefined;
      const roomId = 'room456';

      const result = await parseRoomIdentity(req, roomId, user);

      expect(result).toEqual({
        userId: undefined,
        name: undefined,
        guestUuid: undefined,
        isAuthenticated: false,
      });
    });
  });
});
