/*
=============================================================================
Repair Legacy Bank Transfer Payment Configuration
=============================================================================

إصلاح إعدادات BANK_TRANSFER القديمة التي حُفظت قبل اشتقاق
configurationType مركزيًا، وربط الإعداد بحساب بنكي نشط عند غياب الربط.

التشغيل الافتراضي Dry Run:
node scripts/migrations/repair-bank-transfer-payment-configuration.js

التطبيق الفعلي:
$env:APPLY_BANK_TRANSFER_CONFIGURATION_REPAIR="true"
node scripts/migrations/repair-bank-transfer-payment-configuration.js
Remove-Item Env:APPLY_BANK_TRANSFER_CONFIGURATION_REPAIR
=============================================================================
*/

import mongoose from "mongoose";
import "dotenv/config";

import PaymentConfiguration from "../../models/payments/payment-configuration-model.js";
import BankAccount from "../../models/payments/bank-account-model.js";

const uri =
  process.env.DB_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MongoDB connection URI is missing");
}

const apply =
  process.env.APPLY_BANK_TRANSFER_CONFIGURATION_REPAIR === "true";

const isStoredApiError = (value) => {
  const text = String(value || "").trim();

  return (
    (text.startsWith("{") || text.startsWith("[")) &&
    /"(?:success|message|field|errors)"\s*:/.test(text)
  );
};

try {
  await mongoose.connect(uri, {
    dbName: process.env.DB_NAME || "umrahDB",
  });

  const configurations = await PaymentConfiguration.find({
    paymentMethodCode: "BANK_TRANSFER",
    isDeleted: { $ne: true },
  });

  const fallbackAccount = await BankAccount.findOne({
    isActive: true,
    isDeleted: { $ne: true },
  }).sort({ isDefault: -1, sortOrder: 1, createdAt: 1 });

  const changes = configurations.map((configuration) => {
    const bankAccountIds = Array.isArray(configuration.bankAccountIds)
      ? configuration.bankAccountIds.filter(Boolean)
      : [];

    if (!bankAccountIds.length && fallbackAccount?._id) {
      bankAccountIds.push(fallbackAccount._id);
    }

    return {
      id: configuration._id,
      sectionCode: configuration.sectionCode,
      fromType: configuration.configurationType,
      toType: "BANK_ACCOUNT",
      bankAccountIds,
      instructionsAr: isStoredApiError(configuration.instructionsAr)
        ? "يرجى اختيار الحساب البنكي ثم تحويل المبلغ ورفع إثبات التحويل."
        : configuration.instructionsAr,
      instructionsEn: isStoredApiError(configuration.instructionsEn)
        ? "Select a bank account, transfer the amount, then upload the transfer proof."
        : configuration.instructionsEn,
    };
  });

  console.log(
    JSON.stringify(
      {
        mode: apply ? "APPLY" : "DRY_RUN",
        database: mongoose.connection.name,
        fallbackBankAccountId: fallbackAccount?._id || null,
        changes,
      },
      null,
      2,
    ),
  );

  if (apply) {
    if (!fallbackAccount && changes.some((item) => !item.bankAccountIds.length)) {
      throw new Error("No active bank account is available for BANK_TRANSFER");
    }

    for (const change of changes) {
      await PaymentConfiguration.updateOne(
        { _id: change.id },
        {
          $set: {
            configurationType: change.toType,
            providerId: null,
            bankAccountIds: change.bankAccountIds,
            instructionsAr: change.instructionsAr,
            instructionsEn: change.instructionsEn,
            requiresAttachment: true,
            requiresReference: true,
          },
        },
      );
    }

    console.log(`Repaired ${changes.length} BANK_TRANSFER configuration(s).`);
  }
} finally {
  await mongoose.disconnect();
}
