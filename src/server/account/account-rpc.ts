import { createServerFn } from "@tanstack/react-start"
import { protectedFunctionMiddleware } from "../auth/protected-function"
import { inviteIdSearchParamsSchema } from "../dtos"
import { GetUserInviteRateLimit, GetUserUploadRateLimit } from "./rate-limit-service"
import { AcceptInvitationToUpload, CreateUploadInvitation } from "./invitation-service"
import { GetRecentReceipts, GetRecentRooms } from "./account-service"
import { getServerSession } from "../auth/get-server-session"
import { getRequest } from "@tanstack/react-start/server"

export const getUserRpc = createServerFn({ method: 'GET' })
    .handler(async ({ context }) => {
        const request = getRequest();
        const session = await getServerSession(request, context.auth);
        return session?.user;
    })

export const getUserUploadRateLimitRpc = createServerFn({ method: 'GET' })
    .middleware([protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        return await GetUserUploadRateLimit(context.db, context.user)
    })

export const getUserInviteRateLimitRpc = createServerFn({ method: 'GET' })
    .middleware([protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        return await GetUserInviteRateLimit(context.db, context.user)
    })

export const getUserRecentReceipts = createServerFn({ method: 'GET' })
    .middleware([protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        return await GetRecentReceipts(context.db, context.user)
    })

export const getUserRecentRooms = createServerFn({ method: 'GET' })
    .middleware([protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        return await GetRecentRooms(context.db, context.user)
    })

export const createInviteRpc = createServerFn({ method: 'POST' })
    .middleware([protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        return await CreateUploadInvitation(context.db, context.user)
    })

export const acceptInviteRpc = createServerFn({ method: 'POST' })
    .middleware([protectedFunctionMiddleware])
    .inputValidator(inviteIdSearchParamsSchema)
    .handler(async ({ data, context }) => {
        return await AcceptInvitationToUpload(context.db, context.user.id, data.token)
    })
