import z from 'zod'

export const ReceiptItemSchema = z.object({
    rawText: z.string().min(1),
    interpreted: z.string().min(1),
    price: z.number().nonnegative(),
    quantity: z.number().positive().default(1),
})

export const ParsedReceiptSchema = z.object({
    items: z
        .array(ReceiptItemSchema)
        .min(1, 'Receipt must have at least one item'),
    subtotal: z.number().nonnegative(),
    tax: z.number().nonnegative().default(0),
    tip: z.number().nonnegative().default(0),
    total: z.number().positive(),
    metadata: z
        .object({
            restaurant: z.string().nullish(),
            date: z.string().nullish(),
        })
        .optional()
        .default({ restaurant: "Unnamed", date: new Date().toISOString() }),
})

export type ParsedReceipt = z.infer<typeof ParsedReceiptSchema>
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>

export type ReceiptJob = {
    receiptId: string
    __sentry_trace?: string;
    __sentry_baggage?: string;
}
