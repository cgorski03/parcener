import { createServerFn } from "@tanstack/react-start"
import { protectedFunctionMiddleware } from "../auth/protected-function"
import { getUserRateLimit } from "./account-service"

export const getRateLimitRpc = createServerFn({ method: 'GET' })
    .middleware([protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        return getUserRateLimit(context.db, context.user)
    })
