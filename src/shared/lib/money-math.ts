type ReceiptItemLike = {
  price: number;
};

const MONEY_EPSILON = 0.01;

export const calculateItemTotal = (items: Array<ReceiptItemLike>) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

export const moneyValuesEqual = (price1: number, price2: number) => {
  const diff = Math.abs(price1 - price2);
  return diff < MONEY_EPSILON;
};
