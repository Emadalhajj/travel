import mongoose from "mongoose";
import { PRICING_DISCOUNT_TYPE_VALUES } from "../../constants/pricing/pricing-constants.js";

const usageRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    paymentTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentTransaction",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    consumedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    discountType: {
      type: String,
      enum: PRICING_DISCOUNT_TYPE_VALUES,
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    minimumAmount: { type: Number, min: 0, default: 0 },
    usageLimit: { type: Number, min: 1, default: null },
    usageCount: { type: Number, min: 0, default: 0 },
    perCustomerLimit: { type: Number, min: 1, default: 1 },
    applicableTo: {
      scope: { type: String, enum: ["ALL", "SELECTED"], default: "ALL" },
      serviceTypes: { type: [String], default: [] },
      productIds: { type: [String], default: [] },
    },
    usageRecords: { type: [usageRecordSchema], default: [], select: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

couponSchema.path("value").validate(function validatePercentage(value) {
  return this.discountType !== "PERCENTAGE" || value <= 100;
}, "Percentage coupon cannot exceed 100");

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
