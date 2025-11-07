import z from "zod";

export const ReceiptItemSchema = z.object({
    rawText: z.string().min(1),
    interpreted: z.string().min(1),
    price: z.number().positive(),
    quantity: z.number().positive().default(1),
});

export const ParsedReceiptSchema = z.object({
    items: z.array(ReceiptItemSchema).min(1, 'Receipt must have at least one item'),
    subtotal: z.number().nonnegative(),
    tax: z.number().nonnegative().default(0),
    tip: z.number().nonnegative().default(0),
    total: z.number().positive(),
    metadata: z.object({
        restaurant: z.string().optional(),
        date: z.string().optional(),
    }).optional().default({}),
});

export type ParsedReceipt = z.infer<typeof ParsedReceiptSchema>;
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
