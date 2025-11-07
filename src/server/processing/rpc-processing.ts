import { createServerFn } from "@tanstack/react-start";
import { processReceipt } from "./processing-service";

export const uploadReceipt = createServerFn({ method: 'POST' })
    .inputValidator((data: FormData) => data)
    .handler(async ({ data }) => {
        const file = data.get('file') as File;
        const buffer = await file.arrayBuffer();
        const createdBy = data.get('createdBy') as string;

        if (!file) throw new Error('No file provided');
        if (!createdBy) throw new Error('Name required');

        const result = await processReceipt(buffer);
        return result;

    });
