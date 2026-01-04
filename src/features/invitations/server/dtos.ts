import z from "zod";

export const inviteIdSearchParamsSchema = z.object({
    token: z.uuid({ version: 'v4' }),
})
