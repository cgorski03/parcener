import { GoogleGenerativeAIProvider } from "@ai-sdk/google";
import { generateText } from 'ai';
import { RECEIPT_PARSE_PROMPT } from "./utils/prompts";
import { ParseError, parseStructuredReceiptResponse } from "./utils/parse-json";
import { ParsedReceiptSchema } from "./types";
import z from "zod";


export const parseReceiptItems = async (ai: GoogleGenerativeAIProvider, imageBuffer: ArrayBuffer) => {
    try {

        const { text, providerMetadata } = await generateText({
            model: ai('gemini-2.5-pro'),
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
        const result = parseStructuredReceiptResponse(text, ParsedReceiptSchema);
        return { ...result, providerMetadata };

    } catch (error) {
        if (error instanceof ParseError) {
            console.error('Failed to parse receipt JSON:', {
                message: error.message,
                rawText: error.rawText.slice(0, 500), // Log first 500 chars
            });
            throw new Error('Failed to parse receipt. The image may be unclear or not a receipt.');
        }

        if (error instanceof z.ZodError) {
            console.error('Receipt validation failed:', error.issues);
            throw new Error('Receipt data is invalid or incomplete.');
        }

        console.error('Unexpected error parsing receipt:', error);
        throw new Error('Failed to process receipt image.');
    }
}
