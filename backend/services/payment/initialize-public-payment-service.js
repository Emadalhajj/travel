/*
=============================================================================
Initialize Public Payment Service
=============================================================================

نقطة الدخول الموحدة لبدء الدفع من صفحة العميل.

المسؤوليات:
-----------------------------------------------------------------------------
1. التحقق من المسودة وإعداد الدفع.
2. حساب المبلغ من الخادم.
3. تحديد مسار التنفيذ:
   - PROVIDER
   - BANK_ACCOUNT
   - MANUAL
4. إنشاء PaymentTransaction عبر الطبقة المركزية فقط.
=============================================================================
*/

import mongoose from "mongoose";

import AppError from "../../utils/AppError.js";

import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import PaymentConfiguration from "../../models/payments/payment-configuration-model.js";

import { createProviderCheckoutService } from "./payment-checkout-service.js";
import {
  createPaymentTransactionService,
  findBlockingPublicPaymentForDraftService,
} from "./paymentTransaction-service.js";
import { buildBookingPricingFromDraft } from "../draft-bookings/draft-booking-service.js";

import { PAYMENT_CONFIGURATION_TYPES } from "../../constants/payments/payment-configuration-types.js";
import { PAYMENT_TRANSACTION_STATUSES } from "../../constants/payments/payment-transaction-statuses.js";
import { PAYMENT_TRANSACTION_EVENT_SOURCES } from "../../constants/payments/payment-transaction-events.js";

const validateObjectId = (value, field) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError("INVALID_LOOKUP_ID", 400, field);
  }
};

const getDraftBooking = async ({ draftId, userId }) => {
  validateObjectId(draftId, "draftId");
  validateObjectId(userId, "userId");

  const draft = await DraftBooking.findOne({
    _id: draftId,
    user: userId,
    status: "draft",
    isDeleted: { $ne: true },
  });

  if (!draft) {
    throw new AppError(
      "DRAFT_BOOKING_UNAVAILABLE",
      404,
      "draftId",
    );
  }

  return draft;
};

const getActivePaymentConfiguration = async ({
  configurationId,
  sectionCode,
  paymentMethodCode,
  currency,
}) => {
  validateObjectId(configurationId, "configurationId");

  const now = new Date();

  const configuration = await PaymentConfiguration.findOne({
    _id: configurationId,
    sectionCode,
    paymentMethodCode,
    isActive: true,
    isDeleted: { $ne: true },
    supportedCurrencies: currency,
    $and: [
      {
        $or: [
          { availableFrom: null },
          { availableFrom: { $exists: false } },
          { availableFrom: { $lte: now } },
        ],
      },
      {
        $or: [
          { availableUntil: null },
          { availableUntil: { $exists: false } },
          { availableUntil: { $gte: now } },
        ],
      },
    ],
  })
    .populate({
      path: "providerId",
      select:
        "code nameAr nameEn environment supportedPaymentMethods isActive isDeleted",
    })
    .populate({
      path: "bankAccountIds",
      select:
        "bankNameAr bankNameEn accountNameAr accountNameEn beneficiaryName iban accountNumber swiftCode currency isActive isDeleted",
    });

  if (!configuration) {
    throw new AppError(
      "PAYMENT_METHOD_NOT_AVAILABLE_FOR_BOOKING",
      404,
      "configurationId",
    );
  }

  return configuration;
};

const validateAmountRules = ({ configuration, amount }) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError("PAYMENT_AMOUNT_INVALID", 400, "amount");
  }

  if (
    configuration.minimumAmount !== null &&
    configuration.minimumAmount !== undefined &&
    numericAmount < configuration.minimumAmount
  ) {
    throw new AppError(
      "PAYMENT_MINIMUM_NOT_MET",
      400,
      "paymentMethodCode",
      { amount: configuration.minimumAmount },
    );
  }

  if (
    configuration.maximumAmount !== null &&
    configuration.maximumAmount !== undefined &&
    numericAmount > configuration.maximumAmount
  ) {
    throw new AppError(
      "PAYMENT_MAXIMUM_EXCEEDED",
      400,
      "paymentMethodCode",
      { amount: configuration.maximumAmount },
    );
  }
};

const resolveSelectedBankAccount = ({
  configuration,
  selectedBankAccountId,
}) => {
  const activeAccounts = (configuration.bankAccountIds || []).filter(
    (account) =>
      account &&
      account.isActive !== false &&
      account.isDeleted !== true,
  );

  if (activeAccounts.length === 0) {
    throw new AppError(
      "BANK_ACCOUNTS_UNAVAILABLE",
      400,
      "selectedBankAccountId",
    );
  }

  if (selectedBankAccountId) {
    const selectedAccount = activeAccounts.find(
      (account) => String(account._id) === String(selectedBankAccountId),
    );

    if (!selectedAccount) {
      throw new AppError(
        "BANK_ACCOUNT_UNAVAILABLE",
        400,
        "selectedBankAccountId",
      );
    }

    return selectedAccount;
  }

  if (activeAccounts.length === 1) return activeAccounts[0];

  throw new AppError(
    "BANK_ACCOUNT_SELECTION_REQUIRED",
    400,
    "selectedBankAccountId",
  );
};

const buildBankAccountSnapshot = (account) => ({
  bankNameAr: account.bankNameAr || "",
  bankNameEn: account.bankNameEn || "",
  accountNameAr: account.accountNameAr || "",
  accountNameEn: account.accountNameEn || "",
  beneficiaryName: account.beneficiaryName || "",
  iban: account.iban || "",
  currency: account.currency || "",
});

const sanitizePublicInstructions = (value) => {
  const instructions = String(value || "").trim();

  if (
    (instructions.startsWith("{") || instructions.startsWith("[")) &&
    /"(?:success|message|field|errors)"\s*:/.test(instructions)
  ) {
    return "";
  }

  return instructions;
};

const initializeBankTransfer = async ({
  draft,
  configuration,
  pricing,
  selectedBankAccountId,
  userId,
}) => {
  const selectedAccount = resolveSelectedBankAccount({
    configuration,
    selectedBankAccountId,
  });

  const transaction = await createPaymentTransactionService({
    draftBooking: draft._id,
    user: draft.user || userId || null,
    paymentConfigurationId: configuration._id,
    paymentMethodCode: configuration.paymentMethodCode,
    bankAccountId: selectedAccount._id,
    bankAccountSnapshot: buildBankAccountSnapshot(selectedAccount),
    amount: pricing.totalPrice,
    currency: pricing.currency || "SAR",
    status: PAYMENT_TRANSACTION_STATUSES.PENDING_PROOF,
    createdBy: userId || draft.user || null,
    reuseExisting: true,
    eventSource: PAYMENT_TRANSACTION_EVENT_SOURCES.PUBLIC_API,
  });

  return {
    action: "BANK_TRANSFER",
    paymentTransactionId: transaction._id,
    status: "PENDING_PROOF",
    requiresAttachment: Boolean(configuration.requiresAttachment),
    requiresReference: Boolean(configuration.requiresReference),
    instructionsAr: sanitizePublicInstructions(configuration.instructionsAr),
    instructionsEn: sanitizePublicInstructions(configuration.instructionsEn),
    bankAccounts: [
      {
        _id: selectedAccount._id,
        bankNameAr: selectedAccount.bankNameAr,
        bankNameEn: selectedAccount.bankNameEn,
        accountNameAr: selectedAccount.accountNameAr,
        accountNameEn: selectedAccount.accountNameEn,
        beneficiaryName: selectedAccount.beneficiaryName,
        iban: selectedAccount.iban,
        accountNumber: selectedAccount.accountNumber,
        swiftCode: selectedAccount.swiftCode,
        currency: selectedAccount.currency,
      },
    ],
  };
};

const initializeManualPayment = async ({
  draft,
  configuration,
  pricing,
  userId,
}) => {
  const transaction = await createPaymentTransactionService({
    draftBooking: draft._id,
    user: draft.user || userId || null,
    paymentConfigurationId: configuration._id,
    paymentMethodCode: configuration.paymentMethodCode,
    amount: pricing.totalPrice,
    currency: pricing.currency || "SAR",
    status: PAYMENT_TRANSACTION_STATUSES.PENDING_APPROVAL,
    createdBy: userId || draft.user || null,
    reuseExisting: true,
    eventSource: PAYMENT_TRANSACTION_EVENT_SOURCES.PUBLIC_API,
  });

  return {
    action: "PENDING_APPROVAL",
    paymentTransactionId: transaction._id,
    status: "PENDING_APPROVAL",
    paymentMethodCode: configuration.paymentMethodCode,
    requiresAttachment: Boolean(configuration.requiresAttachment),
    requiresReference: Boolean(configuration.requiresReference),
    instructionsAr: sanitizePublicInstructions(configuration.instructionsAr),
    instructionsEn: sanitizePublicInstructions(configuration.instructionsEn),
  };
};

export const initializePublicPaymentService = async ({
  draftId,
  configurationId,
  sectionCode,
  paymentMethodCode,
  selectedBankAccountId,
  userId,
  req,
}) => {
  const draft = await getDraftBooking({ draftId, userId });

  const existingPayment =
    await findBlockingPublicPaymentForDraftService({
      draftBookingId: draft._id,
    });

  if (existingPayment) {
    return {
      action: "EXISTING_PAYMENT",
      paymentTransactionId: existingPayment._id,
      status: String(existingPayment.status || "").toUpperCase(),
      paymentMethodCode: existingPayment.methodCode || "",
      providerCode: existingPayment.providerCode || "",
      bookingId: existingPayment.booking || null,
      reused: true,
    };
  }

  const pricing = await buildBookingPricingFromDraft(draft);
  const currency = pricing.currency || draft.currency || "SAR";

  const configuration = await getActivePaymentConfiguration({
    configurationId,
    sectionCode,
    paymentMethodCode,
    currency,
  });

  validateAmountRules({
    configuration,
    amount: pricing.totalPrice,
  });

  if (
    configuration.configurationType ===
    PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT
  ) {
    return initializeBankTransfer({
      draft,
      configuration,
      pricing,
      selectedBankAccountId,
      userId,
    });
  }

  if (
    configuration.configurationType ===
    PAYMENT_CONFIGURATION_TYPES.PROVIDER
  ) {
    const frontendUrl = String(
      process.env.FRONTEND_URL || "http://localhost:3000",
    ).replace(/\/$/, "");

    return createProviderCheckoutService({
      draft,
      configuration,
      pricing,
      customer: {
        email: draft.customer?.email,
        firstName: draft.customer?.firstName,
        lastName: draft.customer?.lastName,
        phone: draft.customer?.phone,
      },
      returnUrl: `${frontendUrl}/booking/payment/${draft._id}/result`,
      req,
    });
  }

  if (
    configuration.configurationType ===
    PAYMENT_CONFIGURATION_TYPES.MANUAL
  ) {
    return initializeManualPayment({
      draft,
      configuration,
      pricing,
      userId,
    });
  }

  throw new AppError(
    "PAYMENT_CONFIGURATION_TYPE_UNSUPPORTED",
    400,
    "configurationType",
  );
};
