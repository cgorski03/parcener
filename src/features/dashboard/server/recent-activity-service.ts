import { desc, eq } from 'drizzle-orm';
import type { AppUser, DbType } from '@/shared/server/db';
import type { RecentRoomInfoDto } from '@/shared/dto/types';
import { receipt, roomMember } from '@/shared/server/db';
import { roomSchema } from '@/shared/dto/dtos';
import { receiptWithItemsToDto } from '@/shared/dto/mappers';

export async function getRecentReceipts(db: DbType, user: AppUser) {
    // Gets the user's 5 most recent receipts
    if (!user.canUpload) {
        return null;
    }
    const receiptEntities = await getUserRecentReceiptsHelper(db, 5, user.id);
    const receiptDtos = receiptEntities.map((entity) =>
        receiptWithItemsToDto(entity),
    );
    return receiptDtos;
}

export async function getRecentRooms(
    db: DbType,
    user: AppUser,
): Promise<Array<RecentRoomInfoDto>> {
    const roomMembers = await db.query.roomMember.findMany({
        where: eq(roomMember.userId, user.id),
        orderBy: [desc(roomMember.joinedAt)],
        limit: 5,
        with: {
            room: {
                with: {
                    hostPaymentMethod: true,
                },
            },
        },
    });

    const result = roomMembers.map(({ joinedAt, room }) => ({
        joinedAt: joinedAt.toISOString(),
        room: roomSchema.parse({
            roomId: room.id,
            receiptId: room.receiptId,
            title: room.title,
            createdBy: room.createdBy,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
            hostPaymentInformation: room.hostPaymentMethod
                ? {
                    type: room.hostPaymentMethod.type,
                    handle: room.hostPaymentMethod.handle,
                }
                : null,
        }),
    }));
    return result;
}

export async function getUserRecentReceiptsHelper(
    db: DbType,
    limit: number,
    userId: string,
) {
    return await db.query.receipt.findMany({
        orderBy: desc(receipt.createdAt),
        where: eq(receipt.userId, userId),
        limit,
        with: {
            items: true,
            processingInfo: true,
        },
    });
}
