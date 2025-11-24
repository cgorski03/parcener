import { GoogleGenerativeAIProvider } from "@ai-sdk/google";
import { generateText } from 'ai';
import { RECEIPT_PARSE_PROMPT } from "./utils/prompts";
import { ParseError, parseProviderMetadata, parseStructuredReceiptResponse, UsageMetadata } from "./utils/parse-json";
import { ParsedReceiptSchema, ReceiptJob } from "./types";
import z from "zod";
import { google } from "../llm";
import {
    createProcessingError,
    createProcessingStub,
    saveReceiptInformation,
    finishReceiptProcessingRunSuccess
} from "./repository";
import { DbType, receipt } from "../db";

const RECEIPT_PROCESSING_MODEL = 'gemini-2.5-pro';

export async function createReceiptStub(db: DbType, receiptId: string, userId: string) {
    await db.insert(receipt).values({
        id: receiptId,
        userId,
    });
}

export async function processReceipt(db: DbType, receiptId: string, imageSource: R2Bucket) {
    const ai = google();
    // Insert the stub records to the database
    const runId = await createProcessingStub(db, receiptId);
    let metadata: UsageMetadata | null = null;
    let rawResponse: string | null = null;

    try {
        // Get the image from R3
        const image = await imageSource.get(receiptId);
        if (!image) {
            const error = 'Image not found at source';
            console.error(error);
            createProcessingError(db, {
                runId,
            }, error)
            return;
        }
        const imageObj = await image.arrayBuffer();
        const { text, providerMetadata } = await requestAiProcessingHelper(ai, imageObj);
        rawResponse = text;
        if (providerMetadata) {
            metadata = parseProviderMetadata(providerMetadata);
        }
        const items = parseStructuredReceiptResponse(text, ParsedReceiptSchema)
        await saveReceiptInformation(db, receiptId, items);
        await finishReceiptProcessingRunSuccess(db, runId, { model: RECEIPT_PROCESSING_MODEL, tokens: metadata?.totalTokenCount ?? null })
        return { receiptId }
    }
    catch (error) {
        if (error instanceof ParseError) {
            console.error('Failed to parse receipt JSON:', {
                message: error.message,
                rawText: error.rawText.slice(0, 500),
            });
            createProcessingError(db, {
                runId,
                model: RECEIPT_PROCESSING_MODEL,
                processingTokens: metadata?.totalTokenCount,
            }, error
            )
            throw new Error('Failed to parse receipt. The image may be unclear or not a receipt.');
        }
        if (error instanceof z.ZodError) {
            console.error('Receipt validation failed:', error.issues);
            createProcessingError(db, {
                runId,
                model: RECEIPT_PROCESSING_MODEL,
                processingTokens: metadata?.totalTokenCount,
            }, error);
            throw new Error('Receipt data is invalid or incomplete.');
        }
        createProcessingError(db, {
            runId,
            model: RECEIPT_PROCESSING_MODEL,
            processingTokens: metadata?.totalTokenCount,
        }, error);
        console.error('Unexpected error parsing receipt:', error);
        throw new Error('Failed to process receipt image.');
    }
}

const requestAiProcessingHelper = async (ai: GoogleGenerativeAIProvider, imageBuffer: ArrayBuffer) => {
    const { text, providerMetadata } = await generateText({
        model: ai(RECEIPT_PROCESSING_MODEL),
        system: RECEIPT_PARSE_PROMPT,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'image' as const,
                        image: imageBuffer,
                    },
                ],
            },
        ],
    });
    return { text, providerMetadata }
}

export async function processingQueueHandler(db: DbType, batch: MessageBatch<ReceiptJob>, env: Env, _: ExecutionContext) {
    for (const message of batch.messages) {
        try {
            await processReceipt(db, message.body.receiptId, env.parcener_receipt_images);
            message.ack()
        } catch (error) {
            console.error('Queue job failed:', error)
            message.retry()
        }
    }
}
