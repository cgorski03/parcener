import { AppUser, DbType } from "../db";
import { receiptEntityWithReferencesToDtoHelper } from "../dtos";
import { getUserRecentReceiptsHelper } from "../get-receipt/get-receipt-service";

export async function GetRecentReceipts(
    db: DbType,
    user: AppUser
) {
    // Gets the user's 5 most recent receipts
    if (!user.canUpload) {
        return null;
    }
    const receiptEntities = await getUserRecentReceiptsHelper(db, 5, user.id);
    const receiptDtos = receiptEntities.map((receipt) => receiptEntityWithReferencesToDtoHelper(receipt));
    return receiptDtos;
}

export async function GetRecentRooms(
    db: DbType,
    user: AppUser
) {

}

