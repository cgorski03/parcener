import { and, eq } from 'drizzle-orm';
import type {
  CreatePaymentMethodRequest,
  PaymentMethodDto,
} from '@/shared/dto/types';
import type { AppUser, DbType} from '@/shared/server/db';
import { mapPaymentMethodToDto } from '@/shared/dto/mappers';
import { paymentMethod, user } from '@/shared/server/db';

export async function getUserPaymentMethods(
  db: DbType,
  requestingUser: AppUser,
): Promise<Array<PaymentMethodDto>> {
  const returnedUser = await db.query.user.findFirst({
    where: eq(user.id, requestingUser.id),
    with: {
      paymentMethods: true,
    },
  });

  if (!returnedUser) return [];
  return returnedUser.paymentMethods.map((method) =>
    mapPaymentMethodToDto(method),
  );
}

export async function createUserPaymentMethod(
  db: DbType,
  appUser: AppUser,
  request: CreatePaymentMethodRequest,
): Promise<PaymentMethodDto> {
  if (request.isDefault) {
    await db
      .update(paymentMethod)
      .set({ isDefault: false })
      .where(eq(paymentMethod.userId, appUser.id));
  }

  const [newMethod] = await db
    .insert(paymentMethod)
    .values({
      userId: appUser.id,
      type: request.type,
      handle: request.handle,
      isDefault: request.isDefault,
    })
    .returning();

  return mapPaymentMethodToDto(newMethod);
}

export async function deleteUserPaymentMethod(
  db: DbType,
  appUser: AppUser,
  id: string,
): Promise<void> {
  await db
    .delete(paymentMethod)
    .where(and(eq(paymentMethod.id, id), eq(paymentMethod.userId, appUser.id)));
}

export async function getPaymentMethodSecure(
  db: DbType,
  userId: string,
  paymentMethodId: string,
) {
  return await db.query.paymentMethod.findFirst({
    where: and(
      eq(paymentMethod.id, paymentMethodId),
      eq(paymentMethod.userId, userId),
    ),
  });
}
