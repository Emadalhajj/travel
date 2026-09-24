import mongoose from "mongoose";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "../../constants/currencies.js";

export const pricingQuoteSchema = new mongoose.Schema({
  version: { type: Number, default: null },
  lines: { type: [mongoose.Schema.Types.Mixed], default: undefined },
  subtotal: { type: Number, min: 0, default: 0 },
  adminDiscountAmount: { type: Number, min: 0, default: 0 },
  coupon: { type: mongoose.Schema.Types.Mixed, default: null },
  couponDiscountAmount: { type: Number, min: 0, default: 0 },
  taxableAmount: { type: Number, min: 0, default: 0 },
  taxAmount: { type: Number, min: 0, default: 0 },
  total: { type: Number, min: 0, default: 0 },
  currency: { type: String, enum: SUPPORTED_CURRENCIES, default: DEFAULT_CURRENCY },

  // Legacy read compatibility. New authoritative writes use the V2 fields above.
  tax: { type: Number, min: 0, default: 0 },
  taxRate: { type: Number, min: 0, default: 0 },
  discount: { type: Number, min: 0, default: 0 },
  totalPrice: { type: Number, min: 0, default: 0 },
  totalAmount: { type: Number, min: 0, default: 0 },
  roomPrice: { type: Number, min: 0, default: 0 },
  visaPrice: { type: Number, min: 0, default: 0 },
  tripPrice: { type: Number, min: 0, default: 0 },
  transportPrice: { type: Number, min: 0, default: 0 },
}, { _id: false });

