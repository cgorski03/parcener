import { GoogleGenerativeAIProvider } from "@ai-sdk/google";
import { generateText } from 'ai';
import { RECEIPT_PARSE_PROMPT } from "./utils/prompts";
import { ParseError, parseProviderMetadata, parseStructuredReceiptResponse, UsageMetadata } from "./utils/parse-json";
import { ParsedReceiptSchema } from "./types";
import z from "zod";
import { google } from "../llm";
import { createProcessingError, createReceiptStub as beginReceiptProcessingRun, saveReceiptInformation, finishReceiptProcessingRunSuccess } from "./repository";

const RECEIPT_PROCESSING_MODEL = 'gemini-2.5-flash';

export async function processReceipt(imageBuffer: ArrayBuffer) {
    const ai = google();
    const receiptId = crypto.randomUUID();
    // Insert the stub records to the database
    const runId = await beginReceiptProcessingRun(receiptId);
    let metadata: UsageMetadata | null = null;
    let rawResponse: string | null = null;
    try {
        const { text, providerMetadata } = await processReceiptItems(ai, imageBuffer);
        rawResponse = text;
        if (providerMetadata) {
            metadata = parseProviderMetadata(providerMetadata);
        }
        const items = parseStructuredReceiptResponse(text, ParsedReceiptSchema)
        await saveReceiptInformation(receiptId, items);
        await finishReceiptProcessingRunSuccess(runId, { model: RECEIPT_PROCESSING_MODEL, tokens: metadata?.totalTokenCount ?? null })
        return { receiptId }
    }
    catch (error) {
        if (error instanceof ParseError) {
            console.error('Failed to parse receipt JSON:', {
                message: error.message,
                rawText: error.rawText.slice(0, 500),
            });
            createProcessingError({
                runId,
                model: RECEIPT_PROCESSING_MODEL,
                processingTokens: metadata?.totalTokenCount,
            }, error
            )
            throw new Error('Failed to parse receipt. The image may be unclear or not a receipt.');
        }
        if (error instanceof z.ZodError) {
            console.error('Receipt validation failed:', error.issues);
            createProcessingError({
                runId,
                model: RECEIPT_PROCESSING_MODEL,
                processingTokens: metadata?.totalTokenCount,
            }, error);
            throw new Error('Receipt data is invalid or incomplete.');
        }
        createProcessingError({
            runId,
            model: RECEIPT_PROCESSING_MODEL,
            processingTokens: metadata?.totalTokenCount,
        }, error);
        console.error('Unexpected error parsing receipt:', error);
        throw new Error('Failed to process receipt image.');
    }
}

export const processReceiptItems = async (ai: GoogleGenerativeAIProvider, imageBuffer: ArrayBuffer) => {
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
