import { getServerSession } from "./get-server-session";

export type RoomIdentity = {
    userId?: string;
    guestUuid?: string;
    name?: string;
    isAuthenticated: boolean;
}

export async function parseRoomIdentity(req: Request, roomId: string): Promise<RoomIdentity> {
    const session = await getServerSession(req);
    if (session?.data?.user.id != null) {
        return {
            userId: session.data.user.id,
            name: session.data.user.name,
            guestUuid: undefined,
            isAuthenticated: true
        };
    }

    const cookies = req.headers.get('cookie') || '';
    const cookieName = `guest_uuid_room_${roomId}`;
    const match = cookies.match(new RegExp(`${cookieName}=([a-f0-9-]+)`));
    return {
        userId: undefined,
        guestUuid: match?.[1],
        isAuthenticated: false,
    }
}

