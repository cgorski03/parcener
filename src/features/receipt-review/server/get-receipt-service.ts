import { and, eq } from 'drizzle-orm';
import { isFailed, isProcessing, receiptNotFound } from '../lib/receipt-utils';
import { RECEIPT_PROCESSING, RECEIPT_PROCESSING_FAILED } from './responses';
import type { GetReceiptResponse } from './responses';
import type { DbType, ReceiptProcessingState } from '@/shared/server/db';
import type { ReceiptDto } from '@/shared/dto/types';
import type { ValidityState } from '@/shared/lib/receipt-validity';
import { computeReceiptValidity } from '@/shared/lib/receipt-validity';
import { receipt } from '@/shared/server/db';
import { receiptWithItemsToDto } from '@/shared/dto/mappers';
import { NOT_FOUND } from '@/shared/server/response-types';

export type ReceiptWithRoom = ReceiptDto & { roomId?: string };

export async function getReceiptWithItems(
  db: DbType,
  receiptId: string,
  userId: string,
): Promise<GetReceiptResponse> {
  const receiptInformation = await getReceiptWithRelationsHelper(
    db,
    receiptId,
    userId,
  );

  if (!receiptInformation) {
    return NOT_FOUND;
  }
  // Prevent race condition - essentially count the queue as processing
  if (
    receiptInformation.processingInfo.length === 0 ||
    receiptInformation.processingInfo.some(
      (x) => x.processingStatus === 'processing',
    )
  ) {
    return RECEIPT_PROCESSING;
  }

  const hasSuccesses = receiptInformation.processingInfo.some(
    (processingAttempt) => processingAttempt.processingStatus === 'success',
  );

  // have we failed, and dont have a success or a processing
  if (!hasSuccesses && receiptInformation.processingInfo.length > 0) {
    const failedAttemptsCount = receiptInformation.processingInfo.filter(
      (info) => info.processingStatus === 'failed',
    ).length;

    if (failedAttemptsCount === receiptInformation.processingInfo.length) {
      return RECEIPT_PROCESSING_FAILED(failedAttemptsCount);
    }
  }
  const receiptDto = receiptWithItemsToDto(receiptInformation);

  return {
    ...receiptDto,
    roomId: receiptInformation.room?.id,
  };
}

export type ReceiptState =
  | {
      processingStatus: Extract<ReceiptProcessingState, 'processing'>;
      validity: null;
    }
  | {
      processingStatus: Extract<ReceiptProcessingState, 'failed'>;
      attempts: number;
      validity: null;
    }
  | {
      processingStatus: Extract<ReceiptProcessingState, 'success'>;
      validity: ValidityState;
      receipt: ReceiptDto;
    };

export async function getReceiptState(
  db: DbType,
  receiptId: string,
  userId: string,
): Promise<ReceiptState> {
  const foundReceipt = await getReceiptWithItems(db, receiptId, userId);

  if (receiptNotFound(foundReceipt)) {
    throw new Error('Receipt does not exist');
  }

  if (isFailed(foundReceipt)) {
    return {
      processingStatus: 'failed',
      attempts: foundReceipt.attempts,
      validity: null,
    };
  }

  if (isProcessing(foundReceipt)) {
    return {
      processingStatus: 'processing',
      validity: null,
    };
  }

  return {
    processingStatus: 'success',
    validity: computeReceiptValidity(foundReceipt),
    receipt: foundReceipt,
  };
}

async function getReceiptWithRelationsHelper(
  db: DbType,
  receiptId: string,
  userId: string,
) {
  return await db.query.receipt.findFirst({
    where: and(eq(receipt.id, receiptId), eq(receipt.userId, userId)),
    with: {
      items: {
        orderBy: (items, { asc }) => [asc(items.orderIndex)],
      },
      room: true,
      processingInfo: true,
    },
  });
}
