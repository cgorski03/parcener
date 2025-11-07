// src/server/utils/jsonParser.ts
import { z } from 'zod';


export class ParseError extends Error {
    constructor(
        message: string,
        public readonly rawText: string,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = 'ParseError';
    }
}

/**
 * Attempts to extract and parse JSON from LLM responses that may contain
 * markdown formatting, extra text, or other artifacts
 */
export function parseStructuredReceiptResponse<T>(
    rawText: string,
    schema: z.ZodSchema<T>
): T {
    const cleanedText = cleanJsonText(rawText);

    // Try multiple parsing strategies
    const strategies = [
        () => parseJsonDirect(cleanedText),
        () => extractJsonFromMarkdown(rawText),
        () => extractJsonBetweenBraces(rawText),
        () => extractJsonFromCodeBlock(rawText),
    ];

    let lastError: Error | null = null;

    for (const strategy of strategies) {
        try {
            const parsed = strategy();
            if (parsed) {
                // Validate against schema
                const result = schema.safeParse(parsed);
                if (result.success) {
                    return result.data;
                }
                lastError = new Error(
                    `Validation failed: ${formatZodError(result.error)}`
                );
            }
        } catch (error) {
            lastError = error as Error;
            continue;
        }
    }

    throw new ParseError(
        `Failed to parse JSON from response. Last error: ${lastError?.message}`,
        rawText,
        lastError
    );
}

function cleanJsonText(text: string): string {
    return text
        .trim()
        .replace(/^\uFEFF/, '') // Remove BOM
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
}

function parseJsonDirect(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function extractJsonFromMarkdown(text: string): unknown {
    // Match ```json ... ``` or ``` ... ```
    const jsonBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/;
    const match = text.match(jsonBlockRegex);

    if (match?.[1]) {
        return parseJsonDirect(match[1]);
    }
    return null;
}

function extractJsonBetweenBraces(text: string): unknown {
    // Find first { and last } to extract JSON object
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const extracted = text.slice(firstBrace, lastBrace + 1);
        return parseJsonDirect(extracted);
    }
    return null;
}

function extractJsonFromCodeBlock(text: string): unknown {
    // Try to extract from various code block formats
    const patterns = [
        /```json\n([\s\S]*?)\n```/,
        /```\n([\s\S]*?)\n```/,
        /`([\s\S]*?)`/,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) {
            const result = parseJsonDirect(match[1]);
            if (result) return result;
        }
    }
    return null;
}

function formatZodError(error: z.ZodError): string {
    return error.issues
        .map((e) => {
            const path = e.path.length > 0 ? e.path.join('.') : 'root';
            return `${path}: ${e.message}`;
        })
        .join('; ');
}
