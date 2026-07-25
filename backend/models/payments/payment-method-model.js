import mongoose from "mongoose";

import {
  PAYMENT_METHOD_CODE_VALUES,
} from "../../constants/payments/payment-method-codes.js";

const paymentMethodSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      enum: PAYMENT_METHOD_CODE_VALUES,
    },

    nameAr: {
      type: String,
      required: true,
      trim: true,
    },

    nameEn: {
      type: String,
      required: true,
      trim: true,
    },

    descriptionAr: {
      type: String,
      default: "",
      trim: true,
    },

    descriptionEn: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "offline",
        "online",
        "invoice",
        "cash",
        "credit",
      ],
    },

    requiresBankAccount: {
      type: Boolean,
      default: false,
    },

    requiresPaymentProvider: {
      type: Boolean,
      default: false,
    },

    requiresProofUpload: {
      type: Boolean,
      default: false,
    },

    icon: {
      type: String,
      default: "",
      trim: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

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
  {
    timestamps: true,
  },
);

paymentMethodSchema.index({
  isActive: 1,
  isDeleted: 1,
  sortOrder: 1,
});

export default mongoose.model(
  "PaymentMethod",
  paymentMethodSchema,
);
