import { db, room } from "../db";
import { getReceiptIsValid } from "../get-receipt/get-receipt-service";
import { ROOM_CREATE_ERROR } from "../response-types";

type CreateRoomRequest = {
    title: string;
    receiptId: string;
    userId: string;
}

export async function CreateRoom(request: CreateRoomRequest) {
    const { title, receiptId, userId } = request;
    const validResponse = await getReceiptIsValid(receiptId);
    if (!("success" in validResponse)) {
        return validResponse;
    }
    // We know the receipt is in a valid state
    // We can create the room
    try {
        const [newRoom] = await db.insert(room).values({
            receiptId,
            title,
            createdBy: userId
        }).returning();
        return { success: true, room: newRoom }
    } catch (error: any) {
        console.error(error);
        return ROOM_CREATE_ERROR;
    }

}

type JoinRoomGuestRequest = {
    roomId: string;
    displayName: string;
}
type JoinRoomMemberRequest = {
    userId: string;
    roomId: string;
}

export async function JoinRoomGuest(request: JoinRoomGuestRequest) {

}
