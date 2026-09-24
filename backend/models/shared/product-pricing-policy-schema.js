import mongoose from "mongoose";
import { PRICING_DISCOUNT_TYPE_VALUES } from "../../constants/pricing/pricing-constants.js";

const taxPolicySchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  rate: { type: Number, min: 0, max: 100, default: 0 },
  inclusive: { type: Boolean, default: false },
}, { _id: false });

const discountPolicySchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  type: {
    type: String,
    enum: PRICING_DISCOUNT_TYPE_VALUES,
    default: "PERCENTAGE",
  },
  value: {
    type: Number,
    min: 0,
    default: 0,
    validate: {
      validator(value) {
        return this.type !== "PERCENTAGE" || value <= 100;
      },
      message: "Percentage discount cannot exceed 100",
    },
  },
  expiresAt: { type: Date, default: null },
}, { _id: false });

export const productPricingPolicySchema = new mongoose.Schema({
  tax: { type: taxPolicySchema, default: () => ({}) },
  discount: { type: discountPolicySchema, default: () => ({}) },
  couponEligible: { type: Boolean, default: false },
}, { _id: false });
