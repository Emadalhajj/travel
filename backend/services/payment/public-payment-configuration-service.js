import PaymentConfiguration from "../../models/payments/payment-configuration-model.js";

import {
  isPaymentProviderAdapterSupported,
} from "./providers/payment-provider-factory.js";

const createServiceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/*
=============================================================================
Availability Filter
=============================================================================
*/

const buildAvailabilityFilter = (now = new Date()) => ({
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
});

/*
=============================================================================
Amount Validation
=============================================================================
*/

const isAmountAllowed = (configuration, amount) => {
  if (amount === undefined || amount === null) return true;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return false;

  if (
    configuration.minimumAmount !== null &&
    configuration.minimumAmount !== undefined &&
    numericAmount < configuration.minimumAmount
  ) {
    return false;
  }

  if (
    configuration.maximumAmount !== null &&
    configuration.maximumAmount !== undefined &&
    numericAmount > configuration.maximumAmount
  ) {
    return false;
  }

  return true;
};

/*
=============================================================================
Provider Sanitizer
=============================================================================

لا ترسل credentials للواجهة العامة.
=============================================================================
*/

const sanitizeProvider = (provider) => {
  if (!provider) return null;

  return {
    _id: provider._id,
    code: provider.code,
    nameAr: provider.nameAr,
    nameEn: provider.nameEn,
    supportedPaymentMethods:
      provider.supportedPaymentMethods || provider.paymentMethodCodes || [],
    isActive: provider.isActive,
  };
};

/*
=============================================================================
Bank Account Serializer
=============================================================================
*/

const serializeBankAccount = (account) => ({
  _id: account._id,
  bankNameAr: account.bankNameAr,
  bankNameEn: account.bankNameEn,
  accountNameAr: account.accountNameAr,
  accountNameEn: account.accountNameEn,
  beneficiaryName: account.beneficiaryName,
  iban: account.iban,
  accountNumber: account.accountNumber,
  swiftCode: account.swiftCode,
  currency: account.currency,
  isActive: account.isActive,
});

/*
=============================================================================
Public Instructions Sanitizer
=============================================================================
*/

const sanitizePublicInstructions = (value) => {
  const instructions = String(value || "").trim();
  if (!instructions) return "";

  if (
    (instructions.startsWith("{") || instructions.startsWith("[")) &&
    /"(?:success|message|field|errors)"\s*:/.test(instructions)
  ) {
    return "";
  }

  return instructions;
};

/*
=============================================================================
Public Configuration Serializer
=============================================================================
*/

const serializeConfiguration = (configuration) => {
  const data =
    typeof configuration.toObject === "function"
      ? configuration.toObject()
      : configuration;

  return {
    _id: data._id,
    sectionCode: data.sectionCode,
    paymentMethodCode: data.paymentMethodCode,
    configurationType: data.configurationType,
    supportedCurrencies: data.supportedCurrencies || [],
    displayNameAr: data.displayNameAr,
    displayNameEn: data.displayNameEn,
    instructionsAr: sanitizePublicInstructions(data.instructionsAr),
    instructionsEn: sanitizePublicInstructions(data.instructionsEn),
    requiresAttachment: Boolean(data.requiresAttachment),
    requiresReference: Boolean(data.requiresReference),
    minimumAmount: data.minimumAmount,
    maximumAmount: data.maximumAmount,
    sortOrder: data.sortOrder || 0,
    provider: sanitizeProvider(data.providerId),
    bankAccounts: Array.isArray(data.bankAccountIds)
      ? data.bankAccountIds
          .filter((account) => account?.isActive !== false)
          .map(serializeBankAccount)
      : [],
  };
};

/*
=============================================================================
Get Public Payment Configurations
=============================================================================

أي طريقة مفعلة لهذا القسم يمكن أن تظهر للعميل.
التنفيذ الفعلي يظل محكومًا بنوع الإعداد:
PROVIDER / BANK_ACCOUNT / MANUAL.
=============================================================================
*/

export const getPublicPaymentConfigurationsService = async ({
  sectionCode,
  currency = "SAR",
  amount,
}) => {
  if (!sectionCode) {
    throw createServiceError("sectionCode is required");
  }

  const filter = {
    sectionCode,
    isActive: true,
    isDeleted: { $ne: true },
    supportedCurrencies: currency,
    ...buildAvailabilityFilter(),
  };

  const configurations = await PaymentConfiguration.find(filter)
    .populate({
      path: "providerId",
      select:
        "code nameAr nameEn supportedPaymentMethods paymentMethodCodes isActive",
    })
    .populate({
      path: "bankAccountIds",
      select:
        "bankNameAr bankNameEn accountNameAr accountNameEn beneficiaryName iban accountNumber swiftCode currency isActive",
    })
    .sort({ sortOrder: 1, createdAt: 1 });

  return configurations
    .filter((configuration) => isAmountAllowed(configuration, amount))
    .filter((configuration) => {
      if (configuration.configurationType === "PROVIDER") {
        return (
          configuration.providerId &&
          configuration.providerId.isActive !== false &&
          isPaymentProviderAdapterSupported(configuration.providerId.code)
        );
      }

      if (configuration.configurationType === "BANK_ACCOUNT") {
        return (
          Array.isArray(configuration.bankAccountIds) &&
          configuration.bankAccountIds.some(
            (account) => account?.isActive !== false,
          )
        );
      }

      return configuration.configurationType === "MANUAL";
    })
    .map(serializeConfiguration);
};
