import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createReceiptStub } from "./processing-service";
import { getServerSession } from "../auth/get-server-session";
import { env } from "cloudflare:workers";
import { ReceiptJob } from "./types";

export const uploadReceipt = createServerFn({ method: 'POST' })
    .inputValidator((data: FormData) => data)
    .handler(async ({ data, context }) => {
        // Authenticate and Authorie req
        const request = getRequest();
        const session = await getServerSession(request);
        const userId = session.data?.user.id;
        if (userId == null) {
            throw new Error('Not authorized to perform this action');
        }

        const file = data.get('file') as File;
        const buffer = await file.arrayBuffer();

        if (!file) throw new Error('No file provided');

        const receiptId = crypto.randomUUID();
        // Save the receipt image to R3
        await env.parcener_receipt_images.put(receiptId, buffer);
        await createReceiptStub(context.db, receiptId, userId);
        const job: ReceiptJob = {
            receiptId,
        }
        await env.RECEIPT_QUEUE.send(job);
        return { receiptId, created: true }
    });
