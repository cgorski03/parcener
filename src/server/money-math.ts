import { ReceiptItemDto } from './dtos'

const MONEY_EPSILON = 0.01

export const calculateItemTotal = (items: ReceiptItemDto[]) => {
  return items.reduce((sum, item) => sum + item.price, 0)
}
export const moneyValuesEqual = (price1: number, price2: number) =>
  Math.abs(price1 - price2) < MONEY_EPSILON
