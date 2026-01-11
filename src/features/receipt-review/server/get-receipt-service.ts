import { and, eq } from 'drizzle-orm';
import { isFailed, isProcessing, receiptNotFound } from '../lib/receipt-utils';
import { RECEIPT_PROCESSING, RECEIPT_PROCESSING_FAILED } from './responses';
import type { GetReceiptResponse } from './responses';
import type { DbType } from '@/shared/server/db';
import type { ReceiptDto } from '@/shared/dto/types';
import { receipt } from '@/shared/server/db';
import { receiptWithItemsToDto } from '@/shared/dto/mappers';
import { NOT_FOUND } from '@/shared/server/response-types';
import { validateReceiptCalculations } from '@/shared/lib/money-math';

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
  | { status: 'valid'; receipt: ReceiptDto }
  | { status: 'not_found' }
  | { status: 'processing' }
  | { status: 'failed'; attempts: number }
  | {
      status: 'subtotal_mismatch';
      receipt: ReceiptDto;
      clientSubtotal: number;
      serverSubtotal: number;
    }
  | {
      status: 'grandtotal_mismatch';
      receipt: ReceiptDto;
      clientGrandTotal: number;
      serverGrandTotal: number;
    };

export async function getReceiptState(
  db: DbType,
  receiptId: string,
  userId: string,
): Promise<ReceiptState> {
  const foundReceipt = await getReceiptWithItems(db, receiptId, userId);

  if (receiptNotFound(foundReceipt)) {
    return { status: 'not_found' };
  }
  if (isFailed(foundReceipt)) {
    return { status: 'failed', attempts: foundReceipt.attempts };
  }
  if (isProcessing(foundReceipt)) {
    return { status: 'processing' };
  }

  const validation = validateReceiptCalculations(foundReceipt);

  if (!validation.isValid) {
    const { error } = validation;
    if (error.code === 'SUBTOTAL_MISMATCH') {
      return {
        status: 'subtotal_mismatch',
        receipt: foundReceipt,
        clientSubtotal: error.clientSubtotal,
        serverSubtotal: error.serverSubtotal,
      };
    }
    return {
      status: 'grandtotal_mismatch',
      receipt: foundReceipt,
      clientGrandTotal: error.clientGrandTotal,
      serverGrandTotal: error.serverGrandTotal,
    };
  }

  return { status: 'valid', receipt: foundReceipt };
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
