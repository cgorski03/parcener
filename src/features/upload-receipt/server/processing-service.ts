import { generateText } from 'ai';
import * as Sentry from '@sentry/cloudflare';
import z from 'zod';
import { RECEIPT_PARSE_PROMPT } from './utils/prompts';
import {
  ParseError,
  parseProviderMetadata,
  parseStructuredReceiptResponse,
} from './utils/parse-json';
import {
  createProcessingError,
  createProcessingStub,
  finishReceiptProcessingRunSuccess,
  saveReceiptInformation,
} from './repository';
import { google } from './llm';
import { modelParsedReceiptSchema } from './types';
import type {
  GoogleGenerativeAIModelId,
  GoogleThinkingLevel,
  ReceiptJob,
} from './types';
import type { UsageMetadata } from './utils/parse-json';
import type { DbType } from '@/shared/server/db';
import type {
  GoogleGenerativeAIProvider,
  GoogleGenerativeAIProviderOptions,
} from '@ai-sdk/google';
import { receipt } from '@/shared/server/db';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';

const RECEIPT_PROCESSING_MODEL: GoogleGenerativeAIModelId =
  'gemini-3-flash-preview';

type EnqueueReceiptRequest = {
  db: DbType;
  env: Env;
  file: File;
  userId: string;
  thinkingLevel: GoogleThinkingLevel;
};

export async function processUploadAndEnqueue(request: EnqueueReceiptRequest) {
  const { db, env, file, userId, thinkingLevel } = request;
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
    thinkingLevel,
  };

  await env.RECEIPT_QUEUE.send(job);

  return { receiptId };
}

type ProcessReceiptRequest = {
  db: DbType;
  receiptId: string;
  imageSource: R2Bucket;
  thinkingLevel: GoogleThinkingLevel;
};
export async function processReceipt(request: ProcessReceiptRequest) {
  const { db, receiptId, imageSource, thinkingLevel } = request;
  const ai = google();
  const runId = await createProcessingStub({ db, receiptId, thinkingLevel });

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

    const imageBuffer = await image.arrayBuffer();

    const { text, providerMetadata } = await Sentry.startSpan(
      { name: 'ai.generate_text', op: 'ai.inference' },
      () => requestAiProcessingHelper({ ai, imageBuffer, thinkingLevel }),
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
      modelParsedReceiptSchema,
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

const requestAiProcessingHelper = async (request: {
  ai: GoogleGenerativeAIProvider;
  imageBuffer: ArrayBuffer;
  thinkingLevel: GoogleThinkingLevel;
}) => {
  const { ai, imageBuffer, thinkingLevel } = request;

  const { text, providerMetadata } = await generateText({
    model: ai(RECEIPT_PROCESSING_MODEL),
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingLevel,
        },
      } satisfies GoogleGenerativeAIProviderOptions,
    },
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

export async function processingQueueMessageHandler(request: {
  db: DbType;
  message: Message<ReceiptJob>;
  env: Env;
  ctx: ExecutionContext;
}) {
  const { db, message, env } = request;
  const { receiptId, thinkingLevel } = message.body;
  await processReceipt({
    db,
    receiptId,
    imageSource: env.parcener_receipt_images,
    thinkingLevel,
  });
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
