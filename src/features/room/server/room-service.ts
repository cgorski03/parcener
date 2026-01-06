import { eq, and } from 'drizzle-orm'
import { DbTxType, DbType, room, roomMember } from '@/shared/server/db'
import { getReceiptIsValid } from '@/features/receipt-review/server/internal'
import { ROOM_EXISTS_ERROR } from '@/shared/server/response-types'
import type { RoomMemberDto } from '@/shared/dto/types'
import { getRoomMembership } from './room-member-service'
import { RoomIdentity } from '@/shared/auth/server/room-identity'
import { getPaymentMethodSecure } from '@/features/payment-methods/server/internal'

export type CreateRoomRequest = {
    title: string
    receiptId: string
    userId: string
}

export async function createRoom(
    db: DbType,
    receiptId: string,
    paymentMethodId: string | null,
    userId: string,
) {
    const validResponse = await getReceiptIsValid(db, receiptId, userId)
    if (!('success' in validResponse)) {
        return validResponse
    }

    let verifiedPaymentInfo = null
    if (paymentMethodId) {
        const method = await getPaymentMethodSecure(db, userId, paymentMethodId)
        if (!method) {
            return { success: false, error: 'Invalid payment method' }
        }
        verifiedPaymentInfo = method
    }

    return await db.transaction(async (tx) => {
        // look before you leap check, wouldn't work anyway due to db constraints
        const existingRoom = await tx.query.room.findFirst({
            where: eq(room.receiptId, receiptId),
        })

        if (existingRoom) {
            return ROOM_EXISTS_ERROR
        }

        // B. Create the Room
        const [newRoom] = await tx
            .insert(room)
            .values({
                receiptId,
                title: validResponse.receipt?.title ?? 'Untitled Room',
                createdBy: userId,
                hostPaymentMethodId: verifiedPaymentInfo
                    ? verifiedPaymentInfo.id
                    : null,
            })
            .returning()

        return { success: true, room: newRoom }
    })
}

export async function updateRoomPaymentInformation(
    db: DbType,
    roomId: string,
    paymentMethodId: string | null,
    userId: string,
) {
    // Check the user owns this payment method id, if they provided one
    if (paymentMethodId) {
        const method = await getPaymentMethodSecure(db, userId, paymentMethodId)
        if (!method) {
            return null
        }
    }

    return await db.transaction(async (tx) => {
        const [newRoom] = await tx
            .update(room)
            .set({
                hostPaymentMethodId: paymentMethodId,
            })
            .where(and(eq(room.id, roomId), eq(room.createdBy, userId)))
            .returning()

        if (!newRoom) {
            return null
        }
        await touchRoomId(tx, roomId)

        return newRoom
    })
}

export async function GetFullRoomInfo(db: DbType, roomId: string) {
    const result = await db.query.room.findFirst({
        where: eq(room.id, roomId),
        with: {
            receipt: {
                with: {
                    items: true,
                },
            },
            members: {
                with: {
                    user: true,
                },
            },
            claims: true,
            hostPaymentMethod: true,
        },
    })
    if (result == null) return
    const processedMembers: RoomMemberDto[] = result?.members.map((m) => ({
        roomMemberId: m.id,
        displayName: m.displayName,
        avatarUrl: m.user?.image ?? null,
        isGuest: !m.userId,
    }))
    return { ...result, members: processedMembers }
}

export async function GetRoomHeader(db: DbType, roomId: string) {
    const [header] = await db
        .select({ updatedAt: room.updatedAt })
        .from(room)
        .where(eq(room.id, roomId))
    return header
}

export async function joinRoomAction(
    db: DbType,
    input: {
        roomId: string
        identity: RoomIdentity
        displayName?: string
    },
) {
    const { roomId, identity, displayName } = input

    // Get any existing membership
    const existing = await getRoomMembership(db, identity, roomId)

    //  The "Upgrade" Case (Guest -> User)
    if (existing && existing.userId === null && identity.userId) {
        return await db.transaction(async (tx) => {
            const [upgraded] = await tx
                .update(roomMember)
                .set({
                    userId: identity.userId,
                    displayName: displayName || identity.name || existing.displayName, // Prefer new name, then auth name, then old guest name
                })
                .where(eq(roomMember.id, existing.roomMemberId))
                .returning()

            // Touch room
            await touchRoomId(tx, roomId)
            return { member: upgraded, generatedUuid: existing.guestUuid }
        })
    }

    // If they exist and no upgrade needed, just return
    if (existing) {
        return { member: existing, generatedUuid: existing.guestUuid }
    }

    // SCENARIO C: New Member (User or Guest)
    return await db.transaction(async (tx) => {
        const newGuestUuid = identity.isAuthenticated
            ? null
            : identity.guestUuid || crypto.randomUUID()
        const finalName =
            displayName ||
            identity.name ||
            `Guest ${newGuestUuid && newGuestUuid.slice(0, 4)}`

        const [newMember] = await tx
            .insert(roomMember)
            .values({
                roomId,
                userId: identity.userId || null,
                guestUuid: newGuestUuid,
                displayName: finalName,
            })
            .returning()

        await touchRoomId(tx, roomId)

        return { member: newMember, generatedUuid: newGuestUuid }
    })
}

// Helper: Blindly try to touch the room.
// If the receipt has not been turned into a room yet, this affects 0 rows and does nothing.
export async function touchRoomId(db: DbTxType | DbType, roomId: string) {
    await db
        .update(room)
        .set({ updatedAt: new Date() })
        .where(eq(room.id, roomId))
}

export async function touchRoomFromReceipt(
    db: DbTxType | DbType,
    receiptId: string,
) {
    await db
        .update(room)
        .set({ updatedAt: new Date() })
        .where(eq(room.receiptId, receiptId))
}
