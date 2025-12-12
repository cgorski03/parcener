import { desc, eq } from "drizzle-orm";
import { AppUser, DbType, room, roomMember } from "../db";
import { receiptWithItemsToDto, RecentRoomInfoDto, roomSchema } from "../dtos";
import { getUserRecentReceiptsHelper } from "../get-receipt/get-receipt-service";

export async function GetRecentReceipts(
    db: DbType,
    user: AppUser
) {
    // Gets the user's 5 most recent receipts
    if (!user.canUpload) {
        return null;
    }
    const receiptEntities = await getUserRecentReceiptsHelper(db, 5, user.id);
    const receiptDtos = receiptEntities.map((receipt) => receiptWithItemsToDto(receipt));
    return receiptDtos;
}

export async function GetRecentRooms(
    db: DbType,
    user: AppUser
): Promise<RecentRoomInfoDto[]> {
    const roomMembers = await db
        .select({
            joinedAt: roomMember.joinedAt,
            room: {
                roomId: room.id,
                receiptId: room.receiptId,
                title: room.title,
                createdBy: room.createdBy,
                createdAt: room.createdAt,
                updatedAt: room.updatedAt,
            },
        })
        .from(roomMember)
        .innerJoin(room, eq(roomMember.roomId, room.id))
        .where(eq(roomMember.userId, user.id))
        .orderBy(desc(roomMember.joinedAt))
        .limit(5);

    const result = roomMembers.map(({ joinedAt, room }) => ({
        joinedAt: joinedAt.toISOString(),
        room: roomSchema.parse(room),
    }));
    return result;
}

