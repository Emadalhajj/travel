// models/paymentTransaction-model.js

/*
=====================================================
Payment Transaction Model
=====================================================

هذا الموديل يسجل كل عملية دفع مرتبطة بالحجز.

لماذا نحتاجه؟
-----------------------------------------------------
لأن الحجز الواحد قد يحتوي:
- دفعة أولى
- دفعة ثانية
- دفعة نهائية
- عملية فاشلة
- عملية استرجاع

ولا يكفي تخزين paidAmount فقط داخل Booking.
=====================================================
*/

// models/payments/payment-transaction-model.js

import mongoose from "mongoose";
import { PAYMENT_METHOD_CODE_VALUES } from "../../constants/payments/payment-method-codes.js";

const paymentProofSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true,
    },

    originalName: {
      type: String,
      default: "",
      trim: true,
    },

    mimeType: {
      type: String,
      default: "",
      trim: true,
    },

    size: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const paymentTransactionSchema = new mongoose.Schema(
  {
    /*
    قبل إتمام الدفع قد توجد المعاملة مرتبطة بالمسودة فقط.
    بعد نجاح الدفع وتحويل المسودة إلى حجز يتم تعبئة booking.
    */
    draftBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DraftBooking",
      default: null,
      index: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /*
    المرجع الإداري لطريقة الدفع.
    */
    paymentMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
      default: null,
    },

    /*
    Snapshot للكود حتى تبقى المعاملة مفهومة
    حتى لو تغير اسم أو إعداد PaymentMethod لاحقًا.
    */
    methodCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: PAYMENT_METHOD_CODE_VALUES,
    },

    methodNameAr: {
      type: String,
      default: "",
      trim: true,
    },

    methodNameEn: {
      type: String,
      default: "",
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      enum: ["SAR", "USD", "EUR", "GBP", "AED", "EGP", "TRY"],
      default: "SAR",
      uppercase: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "pending_proof",
        "pending_verification",
        "processing",
        "paid",
        "paid_pending_booking",
        "failed",
        "rejected",
        "cancelled",
        "refunded",
        "partially_refunded",
        "expired",
      ],
      default: "pending",
      index: true,
    },

    /*
    الحساب البنكي المستخدم في التحويل البنكي.
    */
    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

    bankAccountSnapshot: {
      bankNameAr: {
        type: String,
        default: "",
      },

      bankNameEn: {
        type: String,
        default: "",
      },

      accountNameAr: {
        type: String,
        default: "",
      },

      accountNameEn: {
        type: String,
        default: "",
      },

      beneficiaryName: {
        type: String,
        default: "",
      },

      iban: {
        type: String,
        default: "",
      },

      currency: {
        type: String,
        default: "",
      },
    },

    transferReference: {
      type: String,
      default: "",
      trim: true,
    },

    transferDate: {
      type: Date,
      default: null,
    },

    proofAttachment: {
      type: paymentProofSchema,
      default: () => ({}),
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    مزود الدفع الإلكتروني مثل HyperPay.
    */
    paymentProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentProvider",
      default: null,
    },

    providerCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    providerEnvironment: {
      type: String,
      enum: ["", "test", "live"],
      default: "",
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    gatewayReference: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    checkoutId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    invoiceNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
  },
  {
    timestamps: true,
  },
);

/*
يجب أن ترتبط المعاملة بمسودة أو بحجز على الأقل.
*/
paymentTransactionSchema.pre("validate", function validatePaymentTarget(next) {
  if (!this.draftBooking && !this.booking) {
    return next(
      new Error(
        "Payment transaction must be linked to a draft booking or booking",
      ),
    );
  }

  next();
});

paymentTransactionSchema.index({
  booking: 1,
  createdAt: -1,
});

paymentTransactionSchema.index({
  draftBooking: 1,
  createdAt: -1,
});

paymentTransactionSchema.index({
  providerCode: 1,
  gatewayReference: 1,
});

export default mongoose.model("PaymentTransaction", paymentTransactionSchema);
