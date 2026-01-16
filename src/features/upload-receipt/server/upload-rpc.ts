import { createServerFn } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';
import { processUploadAndEnqueue } from './processing-service';
import { getUserUploadRateLimit } from './upload-rate-limit-service';
import { uploadReceiptSchema } from './types';
import {
  canUploadMiddleware,
  protectedFunctionMiddleware,
} from '@/shared/auth/server/middleware';
import { nameTransaction } from '@/shared/observability/server/sentry-middleware';
import { logger } from '@/shared/observability/logger';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const uploadReceipt = createServerFn({ method: 'POST' })
  .middleware([canUploadMiddleware, nameTransaction('uploadReceipt')])
  .inputValidator(uploadReceiptSchema)
  .handler(async ({ data: { file, thinkingLevel }, context }) => {
    try {
      if (file.size > MAX_FILE_SIZE) {
        logger.info(
          'File upload rejected (too large)',
          SENTRY_EVENTS.RECEIPT.UPLOAD,
          {
            size: file.size,
            userId: context.user.id,
          },
        );
        throw new Error(`File size exceeds maximum allowed size of 5MB`);
      }

      const result = await processUploadAndEnqueue({
        db: context.db,
        env,
        file,
        userId: context.user.id,
        thinkingLevel,
      });

      logger.info(
        'Receipt queued for processing',
        SENTRY_EVENTS.RECEIPT.ENQUEUE,
        {
          receiptId: result.receiptId,
        },
      );

      return { receiptId: result.receiptId, created: true };
    } catch (error) {
      const msg = (error as Error).message;
      if (msg !== 'No file provided' && !msg.includes('exceeds maximum')) {
        logger.error(error, SENTRY_EVENTS.RECEIPT.UPLOAD, {
          userId: context.user.id,
          fileType: file.type,
          fileSize: file.size,
        });
      }

      throw error;
    }
  });

export const getUserUploadRateLimitRpc = createServerFn({ method: 'GET' })
  .middleware([
    nameTransaction('getUserUploadRateLimit'),
    protectedFunctionMiddleware,
  ])
  .handler(async ({ context }) => {
    try {
      return await getUserUploadRateLimit(context.db, context.user);
    } catch (error) {
      logger.error(error, SENTRY_EVENTS.ACCOUNT.CHECK_UPLOAD_LIMITS);
      throw error;
    }
  });
