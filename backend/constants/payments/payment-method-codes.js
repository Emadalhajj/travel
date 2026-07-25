export const PAYMENT_METHOD_CODES = Object.freeze({
  BANK_TRANSFER: "BANK_TRANSFER",
  SADAD: "SADAD",
  CARD: "CARD",
  MADA: "MADA",
  VISA: "VISA",
  MASTERCARD: "MASTERCARD",
  APPLE_PAY: "APPLE_PAY",
  STC_PAY: "STC_PAY",
  CASH: "CASH",
  CREDIT: "CREDIT",
});
// Get all possible payment method codes 
// تجميد الكائن لمنع التعديلات عليه
export const PAYMENT_METHOD_CODE_VALUES = Object.freeze(
  Object.values(PAYMENT_METHOD_CODES),
);