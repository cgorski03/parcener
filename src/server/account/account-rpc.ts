import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { getServerSession } from "../auth/get-server-session"
import { canUploadMiddleware, protectedFunctionMiddleware } from "../auth/protected-function"
import { inviteIdSearchParamsSchema } from "../dtos"
import { nameTransaction } from "../observability/sentry-middleware"
import { logger } from "@/lib/logger"
import { SENTRY_EVENTS } from "@/lib/sentry-events"
import { acceptInvitationToUpload, createUploadInvitation, getUserInviteRateLimit, getUserUploadRateLimit, InviteError, RateLimitError } from "./invitation-service"
import { getRecentReceipts, getRecentRooms } from "./account-service"

// WE DONT PUT MIDDLEWARe here we want to control the redirect when this is called
export const getUserRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getUser')])
    .handler(async ({ context }) => {
        try {
            const request = getRequest();
            const session = await getServerSession(request, context.auth);
            return session?.user;
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.AUTH.SESSION_CHECK);
            throw error;
        }
    })

export const getUserUploadRateLimitRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getUserUploadRateLimit'), protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        try {
            return await getUserUploadRateLimit(context.db, context.user)
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.ACCOUNT.CHECK_UPLOAD_LIMITS);
            throw error;
        }
    })

export const getUserInviteRateLimitRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getUserInviteRateLimit'), protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        try {
            return await getUserInviteRateLimit(context.db, context.user)
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.ACCOUNT.CHECK_INVITE_LIMITS);
            throw error;
        }
    })

export const getUserRecentReceiptsRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getUserRecentReceipts'), protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        try {
            return await getRecentReceipts(context.db, context.user)
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.ACCOUNT.GET_RECENT_RECEIPTS);
            throw error;
        }
    })

export const getUserRecentRoomsRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getUserRecentRooms'), protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        try {
            return await getRecentRooms(context.db, context.user)
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.ACCOUNT.GET_RECENT_RECEIPTS);
            throw error;
        }
    })


export const createInviteRpc = createServerFn({ method: 'POST' })
    .middleware([nameTransaction('createInviteRpc'), canUploadMiddleware])
    .handler(async ({ context }) => {
        try {
            return await createUploadInvitation(context.db, context.user)
        } catch (error) {
            if (error instanceof RateLimitError) {
                logger.info("Invite creation blocked by limit", SENTRY_EVENTS.ACCOUNT.INVITE_LIMIT, {
                    userId: context.user.id
                });
                throw error;
            }
            logger.error(error, SENTRY_EVENTS.ACCOUNT.CREATE_INVITATION, {
                userId: context.user.id
            });
            throw error;
        }
    });

export const acceptInviteRpc = createServerFn({ method: 'POST' })
    .middleware([nameTransaction('acceptInviteRpc'), protectedFunctionMiddleware])
    .inputValidator(inviteIdSearchParamsSchema)
    .handler(async ({ data, context }) => {
        try {
            return await acceptInvitationToUpload(context.db, context.user.id, data.token)
        } catch (error) {
            // 1. User Input Error (Code used / Invalid)
            if (error instanceof InviteError) {
                logger.info("Invite acceptance failed", SENTRY_EVENTS.ACCOUNT.ACCEPT_INVITATION, {
                    reason: error.code,
                    inviteId: data.token
                });
                throw error;
            }

            // 2. System Error
            logger.error(error, SENTRY_EVENTS.ACCOUNT.ACCEPT_INVITATION, {
                inviteId: data.token
            });
            throw error;
        }
    })
