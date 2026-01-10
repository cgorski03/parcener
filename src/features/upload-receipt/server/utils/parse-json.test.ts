import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
    ParseError,
    parseProviderMetadata,
    parseStructuredReceiptResponse,
} from './parse-json';

const TestSchema = z.object({
    name: z.string(),
    value: z.number(),
});

describe('parse-json', () => {
    describe('parseStructuredReceiptResponse', () => {
        it('parses direct JSON response', () => {
            const rawText = '{"name": "test", "value": 123}';
            const schema = TestSchema;

            const result = parseStructuredReceiptResponse(rawText, schema);

            expect(result).toEqual({ name: 'test', value: 123 });
        });

        it('parses JSON from markdown code block with json label', () => {
            const rawText = '```json\n{"name": "test", "value": 123}\n```';
            const schema = TestSchema;

            const result = parseStructuredReceiptResponse(rawText, schema);

            expect(result).toEqual({ name: 'test', value: 123 });
        });

        it('parses JSON from markdown code block without label', () => {
            const rawText = '```\n{"name": "test", "value": 123}\n```';
            const schema = TestSchema;

            const result = parseStructuredReceiptResponse(rawText, schema);

            expect(result).toEqual({ name: 'test', value: 123 });
        });

        it('extracts JSON between braces from malformed response', () => {
            const rawText = 'Some text here {"name": "test", "value": 123} more text';
            const schema = TestSchema;

            const result = parseStructuredReceiptResponse(rawText, schema);

            expect(result).toEqual({ name: 'test', value: 123 });
        });

        it('parses JSON from inline code blocks', () => {
            const rawText = '`{"name": "test", "value": 123}`';
            const schema = TestSchema;

            const result = parseStructuredReceiptResponse(rawText, schema);

            expect(result).toEqual({ name: 'test', value: 123 });
        });

        it('removes BOM character', () => {
            const bomChar = '\uFEFF';
            const rawText = `${bomChar}{"name": "test", "value": 123}`;
            const schema = TestSchema;

            const result = parseStructuredReceiptResponse(rawText, schema);

            expect(result).toEqual({ name: 'test', value: 123 });
        });

        it('removes control characters', () => {
            const rawText = '{"name": "test\u0000", "value": 123\u001F\u009F}';
            const schema = TestSchema;

            const result = parseStructuredReceiptResponse(rawText, schema);

            expect(result).toEqual({ name: 'test', value: 123 });
        });

        it('throws ParseError when all strategies fail', () => {
            const rawText = 'This is not JSON at all';
            const schema = TestSchema;

            expect(() => parseStructuredReceiptResponse(rawText, schema)).toThrow(
                ParseError,
            );
            expect(() => parseStructuredReceiptResponse(rawText, schema)).toThrow(
                'Failed to parse JSON from response',
            );
        });

        it('throws ParseError with rawText', () => {
            const rawText = 'Not JSON';
            const schema = TestSchema;

            try {
                parseStructuredReceiptResponse(rawText, schema);
                expect.fail('Should have thrown ParseError');
            } catch (error) {
                expect(error).toBeInstanceOf(ParseError);
                expect((error as ParseError).rawText).toBe(rawText);
            }
        });

        it('throws ParseError when schema validation fails', () => {
            const rawText = '{"name": "test", "value": "not-a-number"}';
            const schema = TestSchema;

            expect(() => parseStructuredReceiptResponse(rawText, schema)).toThrow(
                ParseError,
            );
        });

        it('throws ParseError when JSON is invalid', () => {
            const rawText = '{"name": "test", "value": 123';
            const schema = TestSchema;

            expect(() => parseStructuredReceiptResponse(rawText, schema)).toThrow(
                ParseError,
            );
        });
    });

    describe('parseProviderMetadata', () => {
        it('returns null when providerMetadata is null', () => {
            const result = parseProviderMetadata(null);

            expect(result).toBeNull();
        });

        it('returns null when providerMetadata is undefined', () => {
            const result = parseProviderMetadata(undefined);

            expect(result).toBeNull();
        });

        it('returns null when providerMetadata is not an object', () => {
            const result = parseProviderMetadata('not-an-object');

            expect(result).toBeNull();
        });

        it('returns null when google key is missing', () => {
            const metadata = { other: 'data' };

            const result = parseProviderMetadata(metadata);

            expect(result).toBeNull();
        });

        it('returns null when google is not an object', () => {
            const metadata = { google: 'not-an-object' };

            const result = parseProviderMetadata(metadata);

            expect(result).toBeNull();
        });

        it('returns null when usageMetadata is missing', () => {
            const metadata = { google: {} };

            const result = parseProviderMetadata(metadata);

            expect(result).toBeNull();
        });

        it('returns null when usageMetadata is not an object', () => {
            const metadata = { google: { usageMetadata: 'not-an-object' } };

            const result = parseProviderMetadata(metadata);

            expect(result).toBeNull();
        });

        it('returns null when required number fields are missing', () => {
            const metadata = {
                google: { usageMetadata: {} },
            };

            const result = parseProviderMetadata(metadata);

            expect(result).toBeNull();
        });

        it('returns null when promptTokenCount is not a number', () => {
            const metadata = {
                google: {
                    usageMetadata: {
                        promptTokenCount: 'not-a-number',
                        candidatesTokenCount: 10,
                        totalTokenCount: 20,
                    },
                },
            };

            const result = parseProviderMetadata(metadata);

            expect(result).toBeNull();
        });

        it('returns valid UsageMetadata when all fields are correct', () => {
            const metadata = {
                google: {
                    usageMetadata: {
                        promptTokenCount: 15,
                        candidatesTokenCount: 25,
                        totalTokenCount: 40,
                    },
                },
            };

            const result = parseProviderMetadata(metadata);

            expect(result).toEqual({
                promptTokenCount: 15,
                candidatesTokenCount: 25,
                totalTokenCount: 40,
            });
        });

        it('handles zero values', () => {
            const metadata = {
                google: {
                    usageMetadata: {
                        promptTokenCount: 0,
                        candidatesTokenCount: 0,
                        totalTokenCount: 0,
                    },
                },
            };

            const result = parseProviderMetadata(metadata);

            expect(result).toEqual({
                promptTokenCount: 0,
                candidatesTokenCount: 0,
                totalTokenCount: 0,
            });
        });
    });
});
