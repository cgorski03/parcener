import { createServerFn } from '@tanstack/react-start';
import { processUploadAndEnqueue } from './processing-service';
import { canUploadMiddleware, protectedFunctionMiddleware } from '@/shared/auth/server/middleware';
import { nameTransaction } from '@/shared/observability/server/sentry-middleware';
import { logger } from '@/shared/observability/logger';
import { env } from 'cloudflare:workers';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';
import { getUserUploadRateLimit } from './upload-rate-limit-service';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const uploadReceipt = createServerFn({ method: 'POST' })
    .middleware([canUploadMiddleware, nameTransaction('uploadReceipt')])
    .inputValidator((data: FormData) => data)
    .handler(async ({ data, context }) => {
        const file = data.get('file') as File;
        try {
            if (!file) {
                throw new Error('No file provided');
            }

            if (file.size > MAX_FILE_SIZE) {
                logger.info("File upload rejected (too large)", SENTRY_EVENTS.RECEIPT.UPLOAD, {
                    size: file.size,
                    userId: context.user.id
                });
                throw new Error(`File size exceeds maximum allowed size of 5MB`);
            }

            const result = await processUploadAndEnqueue(
                context.db,
                env,
                file,
                context.user.id
            );

            logger.info("Receipt queued for processing", SENTRY_EVENTS.RECEIPT.ENQUEUE, {
                receiptId: result.receiptId
            });

            return { receiptId: result.receiptId, created: true };

        } catch (error) {
            const msg = (error as Error).message;
            if (msg !== 'No file provided' && !msg.includes('exceeds maximum')) {
                logger.error(error, SENTRY_EVENTS.RECEIPT.UPLOAD, {
                    userId: context.user.id,
                    fileType: file?.type,
                    fileSize: file?.size
                });
            }

            throw error;
        }
    })

export const getUserUploadRateLimitRpc = createServerFn({ method: 'GET' })
    .middleware([nameTransaction('getUserUploadRateLimit'), protectedFunctionMiddleware])
    .handler(async ({ context }) => {
        try {
            return await getUserUploadRateLimit(context.db, context.user)
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.ACCOUNT.CHECK_UPLOAD_LIMITS);
            throw error;
        }
    })

