import { createMiddleware } from '@tanstack/react-start';
import { User } from 'better-auth';
import { getRequest } from '@tanstack/react-start/server';
import { roomObjSchema } from '@/shared/dto/dtos';
import { getServerSession } from './get-server-session';
import { resolveMembershipState } from '@/features/room/server/room-member-service';

export type RoomIdentity = {
  userId?: string;
  guestUuid?: string;
  name?: string;
  isAuthenticated: boolean;
};

export async function parseRoomIdentity(
  req: Request,
  roomId: string,
  user?: User,
): Promise<RoomIdentity> {
  // We are doing this this way because if a user signs in after having joined as a guest
  // we want to COMBINE the identities, not create two
  const cookies = req.headers.get('cookie') || '';
  const cookieName = `guest_uuid_room_${roomId}`;
  const match = cookies.match(new RegExp(`${cookieName}=([a-f0-9-]+)`));

  return {
    userId: user?.id ?? undefined,
    name: user?.name ?? undefined,
    guestUuid: match?.[1] ?? undefined,
    isAuthenticated: user != null ? true : false,
  };
}

export const roomContextMiddleware = createMiddleware({ type: 'function' })
  .inputValidator(roomObjSchema.loose())
  .server(async ({ next, data, context }) => {
    const { roomId } = data;
    const request = getRequest();

    // 1. Resolve Identity (User ID + Guest Cookie)
    const session = await getServerSession(request, context.auth);
    const identity = await parseRoomIdentity(request, roomId, session?.user);

    // 2. Resolve Membership (Are they already in the DB?)
    const { membership, canMerge } = await resolveMembershipState(
      context.db,
      roomId,
      identity,
    );

    return next({
      context: {
        room: {
          identity,
          membership,
          canMergeGuestToMember: canMerge,
        },
        user: session?.user,
      },
    });
  });
