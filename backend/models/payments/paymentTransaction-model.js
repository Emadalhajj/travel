/*
=====================================================
Payment Transaction Model
=====================================================

السجل المركزي لجميع محاولات الدفع، سواء كانت:
- مزود دفع إلكتروني.
- تحويلًا بنكيًا.
- طريقة يدوية.

تحتفظ المعاملة بـSnapshots ومراجع الدفع، ولا تحفظ
بيانات اعتماد المزود أو Raw Gateway Payload العام.
=====================================================
*/

import mongoose from "mongoose";

import { PAYMENT_METHOD_CODE_VALUES } from "../../constants/payments/payment-method-codes.js";
import { PAYMENT_PROVIDER_CODE_VALUES } from "../../constants/payments/payment-provider-codes.js";
import {
  PAYMENT_TRANSACTION_STORAGE_STATUS_VALUES,
  PAYMENT_TRANSACTION_STATUSES,
} from "../../constants/payments/payment-transaction-statuses.js";
import {
  PAYMENT_TRANSACTION_EVENT_CODE_VALUES,
  PAYMENT_TRANSACTION_EVENT_SOURCE_VALUES,
} from "../../constants/payments/payment-transaction-events.js";

const paymentProofSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },

    url: {
      type: String,
      default: "",
      trim: true,
    },

    publicId: {
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

/*
=====================================================
Payment Transaction Event
=====================================================

Timeline داخلي لكل انتقال أو حدث مهم.
لا يوضع داخله Raw Provider Payload أو Secrets.
=====================================================
*/

const paymentTransactionEventSchema = new mongoose.Schema(
  {
    fromStatus: {
      type: String,
      enum: [null, ...PAYMENT_TRANSACTION_STORAGE_STATUS_VALUES],
      default: null,
    },

    toStatus: {
      type: String,
      enum: [null, ...PAYMENT_TRANSACTION_STORAGE_STATUS_VALUES],
      default: null,
    },

    source: {
      type: String,
      enum: PAYMENT_TRANSACTION_EVENT_SOURCE_VALUES,
      required: true,
    },

    eventCode: {
      type: String,
      enum: PAYMENT_TRANSACTION_EVENT_CODE_VALUES,
      required: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    providerReference: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    _id: true,
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

const paymentTransactionSchema = new mongoose.Schema(
  {
    /*
    قبل إتمام الدفع قد ترتبط المعاملة بالمسودة فقط.
    بعد التحويل إلى Booking يتم تعبئة booking أيضًا.
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

    paymentMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
      default: null,
    },

    paymentConfigurationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentConfiguration",
      default: null,
      index: true,
    },

    /*
    نحتفظ باسم methodCode الحالي لتجنب كسر المشروع.
    وهو يمثل paymentMethodCode المطلوب في طبقة الدفع.
    */
    methodCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: PAYMENT_METHOD_CODE_VALUES,
      index: true,
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
      trim: true,
    },

    status: {
      type: String,
      enum: PAYMENT_TRANSACTION_STORAGE_STATUS_VALUES,
      default: PAYMENT_TRANSACTION_STATUSES.PENDING,
      index: true,
    },

    /*
    يمنع إنشاء معاملتين نشطتين لنفس محاولة الدفع.
    تتم إزالته تلقائيًا عند الانتقال إلى حالة نهائية.
    */
    idempotencyKey: {
      type: String,
      default: undefined,
      trim: true,
    },

    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

    bankAccountSnapshot: {
      bankNameAr: { type: String, default: "" },
      bankNameEn: { type: String, default: "" },
      accountNameAr: { type: String, default: "" },
      accountNameEn: { type: String, default: "" },
      beneficiaryName: { type: String, default: "" },
      iban: { type: String, default: "" },
      currency: { type: String, default: "" },
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

    proofAttachments: {
      type: [paymentProofSchema],
      default: [],
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

    paymentProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentProvider",
      default: null,
    },

    providerCode: {
      type: String,
      enum: ["", ...PAYMENT_PROVIDER_CODE_VALUES],
      default: "",
      uppercase: true,
      trim: true,
      index: true,
    },

    providerEnvironment: {
      type: String,
      enum: ["", "TEST", "LIVE", "test", "live"],
      default: "",
      trim: true,
    },

    /*
    مرجع داخلي يولده النظام قبل الاتصال بالمزود.
    */
    paymentReference: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    /*
    المرجع الذي يعيده مزود الدفع للعملية.
    */
    providerReference: {
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

    redirectUrl: {
      type: String,
      default: "",
      trim: true,
      select: false,
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

    failureReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    /*
    Metadata داخلية منقحة فقط.
    لا تعاد تلقائيًا عبر API ولا تحفظ Secrets.
    */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
      select: false,
    },

    events: {
      type: [paymentTransactionEventSchema],
      default: [],
      select: false,
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

    updatedBy: {
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

    /*
    حقول توافق مؤقتة مع البيانات القديمة.
    لا تستخدم في أي كتابة جديدة ويجب نقلها لاحقًا.
    */
    transactionId: {
      type: String,
      default: "",
      trim: true,
      select: false,
    },

    gatewayReference: {
      type: String,
      default: "",
      trim: true,
      select: false,
    },

    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

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

paymentTransactionSchema.index({ booking: 1, createdAt: -1 });
paymentTransactionSchema.index({ draftBooking: 1, createdAt: -1 });
paymentTransactionSchema.index({ providerCode: 1, providerReference: 1 });
paymentTransactionSchema.index({ paymentConfigurationId: 1, createdAt: -1 });
paymentTransactionSchema.index({
  status: 1,
  isDeleted: 1,
  booking: 1,
  updatedAt: 1,
  _id: 1,
});
paymentTransactionSchema.index({
  draftBooking: 1,
  status: 1,
  isDeleted: 1,
  updatedAt: -1,
});
paymentTransactionSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    sparse: true,
  },
);

export default mongoose.model("PaymentTransaction", paymentTransactionSchema);
