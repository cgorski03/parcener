import { and, eq } from "drizzle-orm";
import { RoomIdentity } from "../auth/parse-room-identity";
import { claim, db, receipt, room } from "../db";
import { ensureRoomMember } from "./room-service";

type ItemClaimRequest = {
    roomId: string;
    receiptItemId: string;
    identity: RoomIdentity;
    newQuantity: number;
}


export async function claimItem(request: ItemClaimRequest) {
    const { roomId, identity, receiptItemId, newQuantity } = request;
    console.log(receiptItemId);
    // Ensure the item belongs to the room 
    const { member } = await ensureRoomMember(identity, roomId);
    return await db.transaction(async (tx) => {
        const item = await tx.query.receiptItem.findFirst({
            where: (items, { eq, exists, and }) => and(
                eq(items.id, receiptItemId),
                exists(
                    tx.select()
                        .from(room)
                        .where(and(
                            eq(room.id, roomId),
                            eq(room.receiptId, items.receiptId)
                        ))
                )
            ),
            with: {
                claims: true
            }
        });

        if (!item) {
            throw new Error("Item was not found or does not belong to this room");
        }

        // Prevent too many from being claimed
        const totalClaimed = item.claims.reduce((sum, c) => sum + (c.memberId != member.id ? Number(c.quantity) : 0), 0);
        if (totalClaimed + newQuantity > parseFloat(item.quantity)) {
            throw new Error("Already claimed");
        }
        if (newQuantity === 0) {
            // This should be a delete operation
            await tx.delete(claim)
                .where(
                    and(
                        eq(claim.roomId, roomId),
                        eq(claim.receiptItemId, receiptItemId),
                        eq(claim.memberId, member.id)
                    )
                );
        } else {
            await tx.insert(claim).values({
                roomId,
                memberId: member.id,
                receiptItemId,
                quantity: newQuantity.toString(),
            }).onConflictDoUpdate({
                target: [claim.roomId, claim.memberId, claim.receiptItemId],
                set: { quantity: newQuantity.toString() }
            });
        }

        await tx.update(room)
            .set({ updatedAt: new Date() })
            .where(eq(room.id, roomId));
    });
}
