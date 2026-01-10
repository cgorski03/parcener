import { AppUser, DbType, invite, user } from '@/shared/server/db';
import { RateLimitError } from '@/shared/server/responses/errors';
import { getStartOfDayUTC } from '@/shared/server/utils/time';
import { and, eq, gte, isNull } from 'drizzle-orm';

const DAILY_INVITE_LIMIT = 3;

export class InviteError extends Error {
    constructor(
        message: string,
        public code: 'NOT_FOUND' | 'ALREADY_USED',
    ) {
        super(message);
        this.name = 'InviteError';
    }
}

export type InviteStatus =
    | 'SUCCESS'
    | 'NOT_FOUND'
    | 'USER_ALREADY_AUTHORIZED'
    | 'ERROR';

export async function getUserInviteRateLimit(db: DbType, user: AppUser) {
    if (!user.canUpload) {
        return {
            canInvite: false,
            used: 0,
            limit: 0,
        };
    }

    const invitations = await _getInvitationsToday(db, user.id);

    return {
        canInvite: invitations.length < DAILY_INVITE_LIMIT,
        used: invitations.length,
        limit: DAILY_INVITE_LIMIT,
    };
}

export async function createUploadInvitation(db: DbType, user: AppUser) {
    // 1. Check Logic (Bubbles errors automatically)
    const { canInvite } = await getUserInviteRateLimit(db, user);

    // 2. Enforce Business Rule
    if (!canInvite) {
        throw new RateLimitError('You have exceeded your daily invitation limit.');
    }

    // 3. Execute
    const [newInvitation] = await db
        .insert(invite)
        .values({
            createdBy: user.id,
        })
        .returning();

    return { inviteId: newInvitation.id };
}

export async function acceptInvitationToUpload(
    db: DbType,
    userId: string,
    inviteId: string,
) {
    const userEntity = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: { canUpload: true },
    });

    if (!userEntity) {
        throw new Error('User context missing during invite acceptance');
    }

    if (userEntity.canUpload) {
        return { status: 'USER_ALREADY_AUTHORIZED' as const };
    }

    // 2. Atomic Transaction
    // We update the invite AND the user together.
    return await db.transaction(async (tx) => {
        const [claimedInvite] = await tx
            .update(invite)
            .set({
                usedAt: new Date(),
                usedBy: userId,
            })
            .where(and(eq(invite.id, inviteId), isNull(invite.usedAt)))
            .returning();

        if (!claimedInvite) {
            throw new InviteError('Invite not found or already used', 'NOT_FOUND');
        }

        await tx.update(user).set({ canUpload: true }).where(eq(user.id, userId));

        return { status: 'SUCCESS' as const };
    });
}

async function _getInvitationsToday(db: DbType, userId: string) {
    const startOfDay = getStartOfDayUTC();
    return await db
        .select()
        .from(invite)
        .where(
            and(eq(invite.createdBy, userId), gte(invite.createdAt, startOfDay)),
        );
}
