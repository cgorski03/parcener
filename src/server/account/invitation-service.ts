import { eq, and, gte } from "drizzle-orm";
import { AppUser, DbType, invite, receipt } from "../db";

const DAILY_UPLOAD_LIMIT = 3;
const DAILY_INVITE_LIMIT = 3;

export class RateLimitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RateLimitError";
    }
}

export async function getUserUploadRateLimit(db: DbType, user: AppUser) {
    if (!user.canUpload) {
        return {
            canUpload: false,
            used: 0,
            limit: DAILY_UPLOAD_LIMIT
        };
    }

    const uploads = await _getUploadsToday(db, user.id);

    return {
        canUpload: uploads.length < DAILY_UPLOAD_LIMIT,
        used: uploads.length,
        limit: DAILY_UPLOAD_LIMIT,
    };
}

export async function getUserInviteRateLimit(db: DbType, user: AppUser) {
    if (!user.canUpload) {
        return {
            canInvite: false, used: 0, limit: 0
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
        throw new RateLimitError("You have exceeded your daily invitation limit.");
    }

    // 3. Execute
    const [newInvitation] = await db.insert(invite).values({
        createdBy: user.id,
    }).returning();

    return { inviteId: newInvitation.id };
}


async function _getUploadsToday(db: DbType, userId: string) {
    const startOfDay = _getStartOfDayUTC();
    return await db
        .select()
        .from(receipt)
        .where(and(eq(receipt.userId, userId), gte(receipt.createdAt, startOfDay)));
}

async function _getInvitationsToday(db: DbType, userId: string) {
    const startOfDay = _getStartOfDayUTC();
    return await db
        .select()
        .from(invite)
        .where(and(eq(invite.createdBy, userId), gte(invite.createdAt, startOfDay)));
}

function _getStartOfDayUTC() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
