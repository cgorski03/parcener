import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { processReceipt } from "./processing-service";
import { getSession } from "../auth-server";

export const uploadReceipt = createServerFn({ method: 'POST' })
    .inputValidator((data: FormData) => data)
    .handler(async ({ data }) => {
        const file = data.get('file') as File;
        const buffer = await file.arrayBuffer();
        const request = getRequest();
        const session = await getSession(request);
        const userId = session.data?.user.id;
        if (userId == null) {
            throw new Error('Not authorized to perform this action');
        }

        if (!file) throw new Error('No file provided');

        const result = await processReceipt(userId, buffer);
        return result;
    });
