import { createServerFn } from "@tanstack/react-start"
import { canUploadMiddleware, protectedFunctionMiddleware } from "../auth/protected-function"
import { inviteIdSearchParamsSchema } from "../dtos"
import { GetUserInviteRateLimit, GetUserUploadRateLimit } from "./rate-limit-service"
import { AcceptInvitationToUpload, CreateUploadInvitation } from "./invitation-service"
import { GetRecentReceipts, GetRecentRooms } from "./account-service"
import { getServerSession } from "../auth/get-server-session"
import { getRequest } from "@tanstack/react-start/server"
import { nameTransaction } from "../observability/sentry-middleware"

export const getUserRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getUser')])
    .handler(async ({ context }) => {
        const request = getRequest();
        const session = await getServerSession(request, context.auth);
        return session?.user;
    })

export const getUserUploadRateLimitRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getUserUploadRateLimit'), protectedFunctionMiddleware])
    .middleware([])
    .handler(async ({ context }) => {
        return await GetUserUploadRateLimit(context.db, context.user)
    })

export const getUserInviteRateLimitRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getUserInviteRateLimit'), protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        return await GetUserInviteRateLimit(context.db, context.user)
    })

export const getUserRecentReceipts = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getUserRecentReceipts'), protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        return await GetRecentReceipts(context.db, context.user)
    })

export const getUserRecentRooms = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getUserRecentRooms'), protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        return await GetRecentRooms(context.db, context.user)
    })

export const createInviteRpc = createServerFn({ method: 'POST' })
    .middleware([nameTransaction('createInviteRpc'), canUploadMiddleware])
    .handler(async ({ context }) => {
        return await CreateUploadInvitation(context.db, context.user)
    })

export const acceptInviteRpc = createServerFn({ method: 'POST' })
    .middleware([nameTransaction('acceptInviteRpc'), protectedFunctionMiddleware])
    .inputValidator(inviteIdSearchParamsSchema)
    .handler(async ({ data, context }) => {
        return await AcceptInvitationToUpload(context.db, context.user.id, data.token)
    })
