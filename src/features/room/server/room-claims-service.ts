import { and, desc, eq } from 'drizzle-orm';
import { touchRoomId } from './room-service';
import { RoomIdentity } from '@/shared/auth/server/room-identity';
import { claim, DbTxType, DbType, room } from '@/shared/server/db';

type ItemClaimRequest = {
    roomId: string;
    roomMemberId: string;
    receiptItemId: string;
    identity: RoomIdentity;
    newQuantity: number;
};

export async function claimItem(db: DbType, request: ItemClaimRequest) {
    const { roomId, roomMemberId, receiptItemId, newQuantity } = request;
    // Ensure the item belongs to the room
    return await db.transaction(async (tx) => {
        const item = await tx.query.receiptItem.findFirst({
            where: (items, { eq, exists, and }) =>
                and(
                    eq(items.id, receiptItemId),
                    exists(
                        tx
                            .select()
                            .from(room)
                            .where(
                                and(eq(room.id, roomId), eq(room.receiptId, items.receiptId)),
                            ),
                    ),
                ),
            with: {
                claims: true,
            },
        });

        if (!item) {
            throw new Error('Item was not found or does not belong to this room');
        }

        // Prevent too many from being claimed
        const totalClaimed = item.claims.reduce(
            (sum, c) => sum + (c.memberId != roomMemberId ? Number(c.quantity) : 0),
            0,
        );
        if (totalClaimed + newQuantity > parseFloat(item.quantity)) {
            throw new Error('Already claimed');
        }
        if (newQuantity === 0) {
            // This should be a delete operation
            await tx
                .delete(claim)
                .where(
                    and(
                        eq(claim.roomId, roomId),
                        eq(claim.receiptItemId, receiptItemId),
                        eq(claim.memberId, roomMemberId),
                    ),
                );
        } else {
            await tx
                .insert(claim)
                .values({
                    roomId,
                    memberId: roomMemberId,
                    receiptItemId,
                    quantity: newQuantity.toString(),
                })
                .onConflictDoUpdate({
                    target: [claim.roomId, claim.memberId, claim.receiptItemId],
                    set: { quantity: newQuantity.toString() },
                });
        }

        await touchRoomId(tx, roomId);
    });
}

// DOES NOT TOUCH ROOM just helper
export async function pruneExcessClaimsHelper(
    db: DbType | DbTxType,
    receiptItemId: string,
    newMaxQuantity: number,
) {
    const existingClaims = await db.query.claim.findMany({
        where: eq(claim.receiptItemId, receiptItemId),
        orderBy: [desc(claim.claimedAt)],
    });
    // Calculate total currently claimed
    const totalClaimed = existingClaims.reduce(
        (sum, c) => sum + Number(c.quantity),
        0,
    );

    // 2. Logic: Do we need to prune claims?
    if (totalClaimed > newMaxQuantity) {
        let quantityToRemove = totalClaimed - newMaxQuantity;

        for (const c of existingClaims) {
            if (quantityToRemove <= 0) break;

            const claimQty = Number(c.quantity);

            if (claimQty <= quantityToRemove) {
                // DELETE the whole claim
                await db.delete(claim).where(eq(claim.id, c.id));
                quantityToRemove -= claimQty;
            } else {
                // REDUCE the claim
                // This happens if someone claimed 2, and we only need to remove 1
                await db
                    .update(claim)
                    .set({ quantity: (claimQty - quantityToRemove).toString() })
                    .where(eq(claim.id, c.id));
                quantityToRemove = 0;
            }
        }
    }
}
