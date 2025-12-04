import { and, eq, isNull } from "drizzle-orm";
import { AppUser, DbType, invite, user } from "../db";
import { AccountResponse, authorizeUserCreateInvite, failure, success } from "./rate-limit-service";

export type InviteStatus = 'SUCCESS' | 'NOT_FOUND' | 'USER_ALREADY_AUTHORIZED' | 'ERROR';

export async function AcceptInvitationToUpload(
    db: DbType,
    userId: string,
    inviteId: string
): Promise<AccountResponse<{ status: InviteStatus }>> {
    try {
        const userEntity = await db.query.user.findFirst({
            where: eq(user.id, userId),
            columns: { canUpload: true },
        });

        if (!userEntity) {
            return failure("User not found", { status: "ERROR" });
        }

        // I don't think it should consume the invite if the user is authorized already
        if (userEntity.canUpload) {
            return success({ status: "USER_ALREADY_AUTHORIZED" });
        }

        // Step 2: Atomic invite claim
        const claimedInvite = await db.transaction(async (tx) => {
            const result = await tx
                .update(invite)
                .set({ usedAt: new Date(), usedBy: userId })
                .where(
                    and(
                        eq(invite.id, inviteId),
                        isNull(invite.usedAt) // Race condition guard
                    )
                )
                .returning();
            return result[0];
        });

        if (!claimedInvite) {
            return failure("Invite not found or already used", { status: "NOT_FOUND" });
        }

        await db
            .update(user)
            .set({ canUpload: true })
            .where(eq(user.id, userId));

        return success({ status: "SUCCESS" });
    } catch (error) {
        console.error("Failed to accept invitation:", error);
        return failure("Failed to accept invitation", { status: "ERROR" });
    }
}

export async function CreateUploadInvitation(
    db: DbType,
    user: AppUser
): Promise<AccountResponse<{ status: "RATE_LIMIT" | "SUCCESS" | "ERROR"; inviteId?: string }>> {
    try {
        const authResult = await authorizeUserCreateInvite(db, user);

        if (!authResult.success || !authResult.data) {
            return failure("Rate limit exceeded", { status: "RATE_LIMIT" });
        }

        const [newInvitation] = await db.insert(invite).values({
            createdBy: user.id,
        }).returning();

        return success({
            status: "SUCCESS",
            inviteId: newInvitation.id,
        });
    } catch (error) {
        console.error("Failed to create invitation:", error);
        return failure("Failed to create invitation", { status: "ERROR" });
    }
}
