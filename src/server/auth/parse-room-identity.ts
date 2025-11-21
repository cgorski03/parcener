import { getServerSession } from "./get-server-session";

export type RoomIdentity = {
    userId?: string;
    guestUuid?: string;
    name?: string;
    isAuthenticated: boolean;
}

export async function parseRoomIdentity(req: Request, roomId: string): Promise<RoomIdentity> {
    const session = await getServerSession(req);
    // We are doing this this way because if a user signs in after having joined as a guest 
    // we want to COMBINE the identities, not create two
    const cookies = req.headers.get('cookie') || '';
    const cookieName = `guest_uuid_room_${roomId}`;
    const match = cookies.match(new RegExp(`${cookieName}=([a-f0-9-]+)`));

    return {
        userId: session?.data?.user.id ?? undefined,
        name: session?.data?.user.name ?? undefined,
        guestUuid: match?.[1] ?? undefined,
        isAuthenticated: session?.data?.user != null ? true : false,
    }
}

