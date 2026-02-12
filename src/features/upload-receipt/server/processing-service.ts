import * as Sentry from '@sentry/cloudflare';
import z from 'zod';
import { ParseError, parseProviderMetadata } from './utils/parse-json';
import {
  createProcessingError,
  createProcessingStub,
  finishReceiptProcessingRunSuccess,
  saveReceiptInformation,
} from './repository';
import { scanReceiptImage } from './lib/receipt-scanner';
import { google } from './lib/llm';
import type { GoogleThinkingLevel } from './types';
import type { DbType } from '@/shared/server/db';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';
import { computeReceiptValidity } from '@/shared/lib/receipt-validity';

type ProcessReceiptRequest = {
  db: DbType;
  receiptId: string;
  imageSource: R2Bucket;
  thinkingLevel: GoogleThinkingLevel;
};

// 1. Main Orchestrator
export async function processReceipt(request: ProcessReceiptRequest) {
  const { db, receiptId, imageSource, thinkingLevel } = request;

  // Initialize run tracking
  const runId = await createProcessingStub({ db, receiptId, thinkingLevel });

  // State tracking for error reporting
  const executionState: {
    rawResponse: string | null;
    tokenUsage: number | null;
    modelUsed: string | null;
  } = { rawResponse: null, tokenUsage: null, modelUsed: null };

  try {
    // A. Fetch Image
    const imageBuffer = await retrieveReceiptImage(
      imageSource,
      receiptId,
      db,
      runId,
    );

    // B. AI Execution (Wrapped in Sentry Span)
    const { data, rawText, providerMetadata, modelUsed } =
      await Sentry.startSpan(
        { name: 'ai.generate_text', op: 'ai.inference' },
        async () =>
          await scanReceiptImage({
            ai: google(),
            imageBuffer,
            thinkingLevel,
          }),
      );

    // C. Telemetry Processing
    executionState.rawResponse = rawText;
    executionState.modelUsed = modelUsed;
    if (providerMetadata) {
      const meta = parseProviderMetadata(providerMetadata);
      executionState.tokenUsage = meta?.totalTokenCount ?? null;
      if (executionState.tokenUsage) {
        recordAiTelemetry(executionState.tokenUsage, modelUsed);
      }
    }

    await saveReceiptInformation(db, { id: receiptId, parsedReceipt: data });

    // Track whether the model got the receipt validity correct on the first try
    const validity = computeReceiptValidity({
      items: data.items,
      subtotal: data.subtotal,
      tax: data.tax,
      tip: data.tip,
      grandTotal: data.total,
    });

    await finishReceiptProcessingRunSuccess(db, runId, {
      model: executionState.modelUsed,
      tokens: executionState.tokenUsage,
      rawModelResponse: rawText,
      initialValidityStatus: validity.status,
    });

    logger.info(
      'Receipt processed successfully',
      SENTRY_EVENTS.RECEIPT.PROCESS_JOB.SUCCESS,
      { receiptId, tokens: executionState.tokenUsage },
    );

    return { receiptId };
  } catch (error) {
    // E. Centralized Error Handling
    await handleProcessingFailure({
      error,
      db,
      runId,
      receiptId,
      ...executionState,
    });
  }
}

// --------------------------------------------------------------------------
// Helper Functions
// --------------------------------------------------------------------------

/**
 * Handles R2 retrieval and throws a specific error if missing to stop flow immediately
 */
async function retrieveReceiptImage(
  bucket: R2Bucket,
  receiptId: string,
  db: DbType,
  runId: string,
): Promise<ArrayBuffer> {
  const image = await bucket.get(receiptId);

  if (!image) {
    const msg = 'Image not found at source';
    await createProcessingError(db, { runId }, msg);
    logger.error(
      new Error(msg),
      SENTRY_EVENTS.RECEIPT.PROCESS_JOB.IMAGE_MISSING,
      { receiptId },
    );
    throw new Error(msg);
  }

  return image.arrayBuffer();
}

/**
 * Updates the active Sentry span with AI metrics
 */
function recordAiTelemetry(tokenCount: number, model: string) {
  const span = Sentry.getActiveSpan();
  if (span) {
    span.setAttribute('ai.tokens', tokenCount);
    span.setAttribute('ai.model', model);
  }
}

/**
 * Centralized error handler to keep the main logic clean.
 * Handles Database logging, Sentry logging, and re-throwing safe errors.
 */
type ErrorHandlerParams = {
  error: unknown;
  db: DbType;
  runId: string;
  receiptId: string;
  rawResponse: string | null;
  tokenUsage: number | null;
  modelUsed: string | null;
};

async function handleProcessingFailure({
  error,
  db,
  runId,
  receiptId,
  rawResponse,
  tokenUsage,
  modelUsed,
}: ErrorHandlerParams) {
  // 1. Save error to Database
  const errorContext = {
    runId,
    modelUsed: modelUsed ?? undefined,
    processingTokens: tokenUsage ?? undefined,
    rawModelResponse: rawResponse ?? undefined,
  };
  await createProcessingError(db, errorContext, error);

  // 2. Log to Sentry & Throw Public Error
  if (error instanceof ParseError) {
    logger.error(error, SENTRY_EVENTS.RECEIPT.PROCESS_JOB.PARSE_AI_JSON, {
      receiptId,
    });
    throw new Error('Failed to parse receipt structure.');
  }

  if (error instanceof z.ZodError) {
    const failedFields = error.issues.map((i) => i.path.join('.'));
    logger.error(error, SENTRY_EVENTS.RECEIPT.PROCESS_JOB.ZOD_VALIDATION_FAIL, {
      receiptId,
      failedFields,
    });
    throw new Error('Receipt data incomplete.');
  }

  // 3. Fallback for unknown errors
  logger.error(error, SENTRY_EVENTS.RECEIPT.PROCESS_JOB.OTHER_ERROR, {
    receiptId,
  });
  throw error;
}
