import { generateText } from 'ai';
import * as Sentry from '@sentry/cloudflare';
import z from 'zod';
import { RECEIPT_PARSE_PROMPT } from './utils/prompts';
import {
  ParseError,
  parseProviderMetadata,
  parseStructuredReceiptResponse,
} from './utils/parse-json';
import { ParsedReceiptSchema } from './types';
import {
  createProcessingError,
  createProcessingStub,
  finishReceiptProcessingRunSuccess,
  saveReceiptInformation,
} from './repository';
import { google } from './llm';
import type {
  UsageMetadata} from './utils/parse-json';
import type { ReceiptJob } from './types';
import type { DbType} from '@/shared/server/db';
import type { GoogleGenerativeAIProvider } from '@ai-sdk/google';
import { receipt } from '@/shared/server/db';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';

const RECEIPT_PROCESSING_MODEL = 'gemini-3-flash-preview';

export async function processUploadAndEnqueue(
  db: DbType,
  env: Env,
  file: File,
  userId: string,
) {
  const receiptId = crypto.randomUUID();

  await env.parcener_receipt_images.put(receiptId, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  await createReceiptStub(db, receiptId, userId);

  const activeSpan = Sentry.getActiveSpan();

  if (activeSpan) {
    activeSpan.setAttribute('receiptId', receiptId);
    activeSpan.setAttribute('fileSize', file.size);
  }

  const traceHeader = activeSpan
    ? Sentry.spanToTraceHeader(activeSpan)
    : undefined;
  const baggageHeader = activeSpan
    ? Sentry.spanToBaggageHeader(activeSpan)
    : undefined;

  const job: ReceiptJob = {
    receiptId,
    __sentry_baggage: baggageHeader,
    __sentry_trace: traceHeader,
  };

  await env.RECEIPT_QUEUE.send(job);

  return { receiptId };
}

export async function processReceipt(
  db: DbType,
  receiptId: string,
  imageSource: R2Bucket,
) {
  const ai = google();
  const runId = await createProcessingStub(db, receiptId);

  // Shared state for error handling block
  let metadata: UsageMetadata | null = null;
  let rawResponse: string | null = null;

  try {
    // 1. Image Retrieval
    const image = await imageSource.get(receiptId);

    if (!image) {
      const msg = 'Image not found at source';
      await createProcessingError(db, { runId }, msg);

      logger.error(
        new Error(msg),
        SENTRY_EVENTS.RECEIPT.PROCESS_JOB.IMAGE_MISSING,
        { receiptId },
      );
      return;
    }

    const imageObj = await image.arrayBuffer();

    const { text, providerMetadata } = await Sentry.startSpan(
      { name: 'ai.generate_text', op: 'ai.inference' },
      () => requestAiProcessingHelper(ai, imageObj),
    );

    rawResponse = text;
    if (providerMetadata) {
      metadata = parseProviderMetadata(providerMetadata);
      const span = Sentry.getActiveSpan();
      span?.setAttribute('ai.tokens', metadata?.totalTokenCount);
      span?.setAttribute('ai.model', RECEIPT_PROCESSING_MODEL);
    }

    // 3. Parsing & Validation
    const parsedReceipt = parseStructuredReceiptResponse(
      text,
      ParsedReceiptSchema,
    );

    // 4. Persistence
    await saveReceiptInformation(db, { id: receiptId, parsedReceipt });
    await finishReceiptProcessingRunSuccess(db, runId, {
      model: RECEIPT_PROCESSING_MODEL,
      tokens: metadata?.totalTokenCount ?? null,
      rawModelResponse: rawResponse,
    });

    logger.info(
      'Receipt processed successfully',
      SENTRY_EVENTS.RECEIPT.PROCESS_JOB.SUCCESS,
      {
        receiptId,
        tokens: metadata?.totalTokenCount,
      },
    );

    return { receiptId };
  } catch (error) {
    const errorContext = {
      runId,
      model: RECEIPT_PROCESSING_MODEL,
      processingTokens: metadata?.totalTokenCount,
      rawModelResponse: rawResponse ?? undefined,
    };
    await createProcessingError(db, errorContext, error);

    // 2. Log to Sentry & Re-throw
    if (error instanceof ParseError) {
      logger.error(error, SENTRY_EVENTS.RECEIPT.PROCESS_JOB.PARSE_AI_JSON, {
        receiptId,
      });
      throw new Error('Failed to parse receipt structure.');
    }

    if (error instanceof z.ZodError) {
      // Log WHICH fields failed, but not the values
      const failedFields = error.issues.map((i) => i.path.join('.'));
      logger.error(
        error,
        SENTRY_EVENTS.RECEIPT.PROCESS_JOB.ZOD_VALIDATION_FAIL,
        {
          receiptId,
          failedFields,
        },
      );
      throw new Error('Receipt data incomplete.');
    }
    logger.error(error, SENTRY_EVENTS.RECEIPT.PROCESS_JOB.OTHER_ERROR, {
      receiptId,
    });
    throw error;
  }
}

const requestAiProcessingHelper = async (
  ai: GoogleGenerativeAIProvider,
  imageBuffer: ArrayBuffer,
) => {
  const { text, providerMetadata } = await generateText({
    model: ai(RECEIPT_PROCESSING_MODEL),
    temperature: 0.3,
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
  return { text, providerMetadata };
};

export async function processingQueueMessageHandler(
  db: DbType,
  message: Message<ReceiptJob>,
  env: Env,
  _: ExecutionContext,
) {
  await processReceipt(db, message.body.receiptId, env.parcener_receipt_images);
  message.ack();
}

async function createReceiptStub(
  db: DbType,
  receiptId: string,
  userId: string,
) {
  await db.insert(receipt).values({
    id: receiptId,
    userId,
  });
}
