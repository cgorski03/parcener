import { User } from 'better-auth'

export type RoomIdentity = {
  userId?: string
  guestUuid?: string
  name?: string
  isAuthenticated: boolean
}

export async function parseRoomIdentity(
  req: Request,
  roomId: string,
  user?: User,
): Promise<RoomIdentity> {
  // We are doing this this way because if a user signs in after having joined as a guest
  // we want to COMBINE the identities, not create two
  const cookies = req.headers.get('cookie') || ''
  const cookieName = `guest_uuid_room_${roomId}`
  const match = cookies.match(new RegExp(`${cookieName}=([a-f0-9-]+)`))

  return {
    userId: user?.id ?? undefined,
    name: user?.name ?? undefined,
    guestUuid: match?.[1] ?? undefined,
    isAuthenticated: user != null ? true : false,
  }
}
