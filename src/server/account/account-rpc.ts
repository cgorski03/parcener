import { createServerFn } from "@tanstack/react-start"
import { protectedFunctionMiddleware } from "../auth/protected-function"
import { AcceptInvitationToUpload, CreateUploadInvitation, getUserRateLimit } from "./account-service"
import { inviteIdSearchParamsSchema } from "../dtos"

export const getRateLimitRpc = createServerFn({ method: 'GET' })
    .middleware([protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        return await getUserRateLimit(context.db, context.user)
    })

export const createInviteRpc = createServerFn({ method: 'POST' })
    .middleware([protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        return await CreateUploadInvitation(context.db, context.user.id)
    })

export const acceptInviteRpc = createServerFn({ method: 'POST' })
    .middleware([protectedFunctionMiddleware])
    .inputValidator(inviteIdSearchParamsSchema)
    .handler(async ({ data, context }) => {
        return await AcceptInvitationToUpload(context.db, context.user.id, data.token)
    })
