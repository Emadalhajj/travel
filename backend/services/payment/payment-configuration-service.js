/*
=====================================================
Payment Configuration Service
=====================================================

مسؤول عن إدارة ربط طرق الدفع بالأقسام.

يدعم:
-----------------------------------------------------
- Get List
- Get By ID
- Create
- Update
- Update Status
- Soft Delete

ويتحقق من:
-----------------------------------------------------
- صحة طريقة الدفع.
- صحة نوع الإعداد.
- وجود مزود الدفع وتفعيله.
- دعم المزود لطريقة الدفع.
- وجود الحسابات البنكية وتفعيلها.
- منع تكرار الطريقة داخل القسم.
- تسجيل Audit Log.
=====================================================
*/

import mongoose from "mongoose";

import PaymentConfiguration from "../../models/payments/payment-configuration-model.js";

import PaymentProvider from "../../models/payments/payment-provider-model.js";

import PaymentMethod from "../../models/payments/payment-method-model.js";

import BankAccount from "../../models/payments/bank-account-model.js";

import {
  isPaymentProviderAdapterSupported,
} from "./providers/payment-provider-factory.js";

import { PAYMENT_CONFIGURATION_TYPES } from "../../constants/payments/payment-configuration-types.js";

import {
  createPaymentConfigurationSchema,
  updatePaymentConfigurationSchema,
  updatePaymentConfigurationStatusSchema,
  validatePaymentConfigurationData,
  validateCompletePaymentConfiguration,
} from "../validators/payment/payment-configuration-validation.js";

import { createAuditLog } from "../audit/audit-log-service.js";

import {
  AUDIT_ACTIONS,
} from "../../constants/audit/audit-actions.js";

import {
  AUDIT_ENTITIES,
} from "../../constants/audit/audit-entities.js";

/*
=====================================================
Payment Method Groups
=====================================================

تحدد السلوك المتوقع لكل طريقة دفع.

مهم:
-----------------------------------------------------
هذه القواعد تمنع إرسال configurationType غير منطقي.

مثال:
BANK_TRANSFER لا يمكن أن يكون PROVIDER.
MADA لا يمكن أن يكون BANK_ACCOUNT.
=====================================================
*/

/*
=====================================================
Service Error
=====================================================
*/

const createServiceError = ({
  message,
  statusCode = 400,
  field = null,
  errors = null,
}) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  if (field) {
    error.field = field;
  }

  if (errors) {
    error.errors = errors;
  }

  return error;
};

/*
=====================================================
Validate Object ID
=====================================================
*/

const validateObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createServiceError({
      message: `قيمة ${fieldName} غير صالحة`,

      statusCode: 400,

      field: fieldName,
    });
  }
};

/*
=====================================================
Normalize Helpers
=====================================================
*/

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const normalizeOptionalString = (value) => {
  const normalized = normalizeString(value);

  return normalized || undefined;
};

/*
=====================================================
Normalize Payload
=====================================================
*/

const normalizePaymentConfigurationPayload = (payload = {}) => {
  const normalized = {
    ...payload,
  };

  if (normalized.sectionCode !== undefined) {
    normalized.sectionCode = normalizeString(
      normalized.sectionCode,
    ).toUpperCase();
  }

  if (normalized.paymentMethodCode !== undefined) {
    normalized.paymentMethodCode = normalizeString(
      normalized.paymentMethodCode,
    ).toUpperCase();
  }

  if (normalized.configurationType !== undefined) {
    normalized.configurationType = normalizeString(
      normalized.configurationType,
    ).toUpperCase();
  }

  const optionalStringFields = [
    "displayNameAr",

    "displayNameEn",

    "instructionsAr",

    "instructionsEn",
  ];

  optionalStringFields.forEach((fieldName) => {
    if (normalized[fieldName] === undefined) {
      return;
    }

    const value = normalizeOptionalString(normalized[fieldName]);

    if (value) {
      normalized[fieldName] = value;
    } else {
      delete normalized[fieldName];
    }
  });

  if (Array.isArray(normalized.supportedCurrencies)) {
    normalized.supportedCurrencies = [
      ...new Set(
        normalized.supportedCurrencies
          .filter(Boolean)
          .map((currency) => normalizeString(currency).toUpperCase()),
      ),
    ];
  }

  if (Array.isArray(normalized.bankAccountIds)) {
    normalized.bankAccountIds = [
      ...new Set(
        normalized.bankAccountIds.filter(Boolean).map((id) => String(id)),
      ),
    ];
  }

  return normalized;
};

/*
=====================================================
Resolve Required Configuration Type
=====================================================

يستنتج النوع الصحيح من كود طريقة الدفع.

لا نعتمد فقط على configurationType القادم من
Frontend.
=====================================================
*/

const resolveRequiredConfigurationType = (
  paymentMethod,
) => {
  if (
    paymentMethod.requiresBankAccount
  ) {
    return PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT;
  }

  if (
    paymentMethod.requiresPaymentProvider
  ) {
    return PAYMENT_CONFIGURATION_TYPES.PROVIDER;
  }

  return PAYMENT_CONFIGURATION_TYPES.MANUAL;
};

/*
=====================================================
Get Active Payment Method
=====================================================

نتأكد أن طريقة الدفع موجودة ومفعلة.

قد يكون اسم حقل الحذف أو التفعيل مختلفًا في موديل
PaymentMethod الحالي، لذلك حافظ على نفس أسماء
الحقول المستخدمة في موديل المشروع.
=====================================================
*/

const getActivePaymentMethod = async (paymentMethodCode) => {
  const paymentMethod = await PaymentMethod.findOne({
    code: paymentMethodCode,

    isActive: true,

    isDeleted: {
      $ne: true,
    },
  }).lean();

  if (!paymentMethod) {
    throw createServiceError({
      message: "طريقة الدفع غير موجودة أو غير مفعلة",

      statusCode: 404,

      field: "paymentMethodCode",

      errors: {
        paymentMethodCode: "طريقة الدفع المحددة غير متاحة",
      },
    });
  }

  return paymentMethod;
};

/*
=====================================================
Validate Provider
=====================================================

يتحقق من:
-----------------------------------------------------
- وجود المزود.
- عدم حذفه.
- تفعيله.
- دعمه لطريقة الدفع.
=====================================================
*/

const validateProviderRelation = async ({ providerId, paymentMethodCode }) => {
  if (!providerId) {
    throw createServiceError({
      message: "مزود الدفع مطلوب",

      statusCode: 400,

      field: "providerId",

      errors: {
        providerId: "يجب تحديد مزود دفع",
      },
    });
  }

  validateObjectId(providerId, "providerId");

  const provider = await PaymentProvider.findOne({
    _id: providerId,

    isDeleted: {
      $ne: true,
    },
  })
    .select(
      "_id code nameAr nameEn supportedPaymentMethods environment isActive",
    )
    .lean();

  if (!provider) {
    throw createServiceError({
      message: "مزود الدفع غير موجود",

      statusCode: 404,

      field: "providerId",

      errors: {
        providerId: "مزود الدفع المحدد غير موجود أو محذوف",
      },
    });
  }

  if (!provider.isActive) {
    throw createServiceError({
      message: "مزود الدفع غير مفعّل",
      statusCode: 400,
      field: "providerId",
      errors: {
        providerId:
          "فعّل المزود بعد استكمال بيانات الاعتماد وWebhook Secret ثم أعد المحاولة",
      },
    });
  }

  if (!isPaymentProviderAdapterSupported(provider.code)) {
    throw createServiceError({
      message: `مزود الدفع ${provider.code} غير مدعوم تشغيليًا`,
      statusCode: 400,
      field: "providerId",
      errors: {
        providerId: "لا يوجد Adapter مسجل لهذا المزود داخل النظام",
      },
    });
  }

  const supportedMethods = Array.isArray(provider.supportedPaymentMethods)
    ? provider.supportedPaymentMethods
    : [];

  if (!supportedMethods.includes(paymentMethodCode)) {
    throw createServiceError({
      message: "مزود الدفع لا يدعم طريقة الدفع المحددة",

      statusCode: 400,

      field: "providerId",

      errors: {
        providerId: `المزود ${provider.code} لا يدعم ${paymentMethodCode}`,
      },
    });
  }

  return provider;
};

/*
=====================================================
Validate Bank Accounts
=====================================================

يتحقق من:
-----------------------------------------------------
- وجود حساب واحد على الأقل.
- صحة المعرفات.
- وجود جميع الحسابات.
- تفعيل الحسابات.
- عدم حذفها.
=====================================================
*/

const validateBankAccountRelations = async (bankAccountIds) => {
  if (!Array.isArray(bankAccountIds) || bankAccountIds.length === 0) {
    throw createServiceError({
      message: "يجب تحديد حساب بنكي واحد على الأقل",

      statusCode: 400,

      field: "bankAccountIds",

      errors: {
        bankAccountIds: "الحسابات البنكية مطلوبة للتحويل البنكي",
      },
    });
  }

  bankAccountIds.forEach((accountId) =>
    validateObjectId(accountId, "bankAccountIds"),
  );

  const uniqueIds = [...new Set(bankAccountIds.map(String))];

  const accounts = await BankAccount.find({
    _id: {
      $in: uniqueIds,
    },

    isActive: true,

    isDeleted: {
      $ne: true,
    },
  })
    .select(
      "_id bankNameAr bankNameEn accountNameAr accountNameEn beneficiaryName iban isActive",
    )
    .lean();

  if (accounts.length !== uniqueIds.length) {
    const foundIds = new Set(accounts.map((account) => String(account._id)));

    const missingIds = uniqueIds.filter((id) => !foundIds.has(id));

    throw createServiceError({
      message: "بعض الحسابات البنكية غير موجودة أو غير مفعلة",

      statusCode: 400,

      field: "bankAccountIds",

      errors: {
        bankAccountIds: `الحسابات غير المتاحة: ${missingIds.join(", ")}`,
      },
    });
  }

  return accounts;
};

/*
=====================================================
Validate Relations
=====================================================

التحقق المركزي من العلاقات حسب نوع الإعداد.
=====================================================
*/

const validatePaymentConfigurationRelations = async (configurationData) => {
  const {
    paymentMethodCode,
    providerId,
    bankAccountIds = [],
  } = configurationData;

  const paymentMethod =
    await getActivePaymentMethod(
      paymentMethodCode,
    );

  const configurationType =
    resolveRequiredConfigurationType(
      paymentMethod,
    );

  const normalizedConfiguration = {
    ...configurationData,
    configurationType,
  };

  if (configurationType === PAYMENT_CONFIGURATION_TYPES.PROVIDER) {
    await validateProviderRelation({
      providerId,

      paymentMethodCode,
    });

    return {
      ...normalizedConfiguration,

      bankAccountIds: [],
    };
  }

  if (configurationType === PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT) {
    await validateBankAccountRelations(bankAccountIds);

    return {
      ...normalizedConfiguration,

      providerId: null,
    };
  }

  return {
    ...normalizedConfiguration,

    providerId: null,

    bankAccountIds: [],
  };
};

/*
=====================================================
Ensure Unique Configuration
=====================================================

يمنع تكرار نفس طريقة الدفع داخل نفس القسم.
=====================================================
*/

const ensureUniqueConfiguration = async ({
  sectionCode,
  paymentMethodCode,
  excludeId = null,
}) => {
  const filter = {
    sectionCode,

    paymentMethodCode,

    isDeleted: {
      $ne: true,
    },
  };

  if (excludeId) {
    filter._id = {
      $ne: excludeId,
    };
  }

  const existing = await PaymentConfiguration.findOne(filter)
    .select("_id sectionCode paymentMethodCode")
    .lean();

  if (existing) {
    throw createServiceError({
      message: "طريقة الدفع مضافة مسبقًا داخل هذا القسم",

      statusCode: 409,

      field: "paymentMethodCode",

      errors: {
        paymentMethodCode: "يوجد إعداد سابق لنفس طريقة الدفع داخل القسم",
      },
    });
  }
};

/*
=====================================================
Build List Filter
=====================================================
*/

const buildPaymentConfigurationFilter = ({
  search,
  sectionCode,
  paymentMethodCode,
  configurationType,
  isActive,
}) => {
  const filter = {
    isDeleted: false,
  };

  if (sectionCode) {
    filter.sectionCode = normalizeString(sectionCode).toUpperCase();
  }

  if (paymentMethodCode) {
    filter.paymentMethodCode = normalizeString(paymentMethodCode).toUpperCase();
  }

  if (configurationType) {
    filter.configurationType = normalizeString(configurationType).toUpperCase();
  }

  if (isActive !== undefined && isActive !== "") {
    filter.isActive = String(isActive) === "true";
  }

  if (search) {
    const normalizedSearch = normalizeString(search);

    filter.$or = [
      {
        sectionCode: {
          $regex: normalizedSearch,

          $options: "i",
        },
      },

      {
        paymentMethodCode: {
          $regex: normalizedSearch,

          $options: "i",
        },
      },

      {
        displayNameAr: {
          $regex: normalizedSearch,

          $options: "i",
        },
      },

      {
        displayNameEn: {
          $regex: normalizedSearch,

          $options: "i",
        },
      },
    ];
  }

  return filter;
};

/*
=====================================================
Get Payment Configurations
=====================================================
*/

export const getPaymentConfigurationsService = async ({
  page = 1,
  limit = 10,
  search = "",
  sectionCode = "",
  paymentMethodCode = "",
  configurationType = "",
  isActive,
  sortBy = "sortOrder",
  sortDirection = "asc",
} = {}) => {
  const safePage = Math.max(Number(page) || 1, 1);

  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const allowedSortFields = new Set([
    "sortOrder",

    "createdAt",

    "updatedAt",

    "sectionCode",

    "paymentMethodCode",

    "configurationType",
  ]);

  const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : "sortOrder";

  const safeSortDirection =
    String(sortDirection).toLowerCase() === "desc" ? -1 : 1;

  const filter = buildPaymentConfigurationFilter({
    search,

    sectionCode,

    paymentMethodCode,

    configurationType,

    isActive,
  });

  const skip = (safePage - 1) * safeLimit;

  const [configurations, total] = await Promise.all([
    PaymentConfiguration.find(filter)
      .populate({
        path: "providerId",

        select: "code nameAr nameEn environment isActive",
      })
      .populate({
        path: "bankAccountIds",

        select:
          "bankNameAr bankNameEn accountNameAr accountNameEn beneficiaryName iban isActive",
      })
      .sort({
        [safeSortBy]: safeSortDirection,

        createdAt: -1,
      })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    PaymentConfiguration.countDocuments(filter),
  ]);

  return {
    items: configurations,

    pagination: {
      page: safePage,

      limit: safeLimit,

      total,

      totalPages: Math.ceil(total / safeLimit),

      hasNextPage: safePage * safeLimit < total,

      hasPreviousPage: safePage > 1,
    },
  };
};

/*
=====================================================
Get Payment Configuration By ID
=====================================================
*/

export const getPaymentConfigurationByIdService = async ({
  configurationId,
}) => {
  validateObjectId(configurationId, "configurationId");

  const configuration = await PaymentConfiguration.findOne({
    _id: configurationId,

    isDeleted: false,
  })
    .populate({
      path: "providerId",

      select: "code nameAr nameEn supportedPaymentMethods environment isActive",
    })
    .populate({
      path: "bankAccountIds",

      select:
        "bankNameAr bankNameEn accountNameAr accountNameEn beneficiaryName iban isActive",
    })
    .lean();

  if (!configuration) {
    throw createServiceError({
      message: "إعداد الدفع غير موجود",

      statusCode: 404,

      field: "configurationId",
    });
  }

  return configuration;
};

/*
=====================================================
Create Payment Configuration
=====================================================
*/

export const createPaymentConfigurationService = async ({
  payload,
  userId,
  req,
}) => {
  const normalizedPayload = normalizePaymentConfigurationPayload(payload);

  const validatedData = validatePaymentConfigurationData({
    schema: createPaymentConfigurationSchema,

    data: normalizedPayload,
  });

  const relationValidatedData =
    await validatePaymentConfigurationRelations(validatedData);

  await ensureUniqueConfiguration({
    sectionCode: relationValidatedData.sectionCode,

    paymentMethodCode: relationValidatedData.paymentMethodCode,
  });

  const configuration = await PaymentConfiguration.create({
    ...relationValidatedData,

    createdBy: userId || null,

    updatedBy: userId || null,
  });

  await createAuditLog({
    req,

    action: AUDIT_ACTIONS.CREATE,

    entity:
      AUDIT_ENTITIES.PAYMENT_CONFIGURATION,

    entityId: configuration._id,

    before: null,

    after: configuration.toObject(),
  });

  return getPaymentConfigurationByIdService({
    configurationId: configuration._id,
  });
};

/*
=====================================================
Update Payment Configuration
=====================================================

تدفق PATCH:
-----------------------------------------------------
1. جلب السجل الحالي.
2. التحقق من الحقول المرسلة.
3. دمج القديم والجديد.
4. التحقق الكامل.
5. التحقق من العلاقات.
6. الحفظ.
=====================================================
*/

export const updatePaymentConfigurationService = async ({
  configurationId,
  payload,
  userId,
  req,
}) => {
  validateObjectId(configurationId, "configurationId");

  const configuration = await PaymentConfiguration.findOne({
    _id: configurationId,

    isDeleted: false,
  });

  if (!configuration) {
    throw createServiceError({
      message: "إعداد الدفع غير موجود",

      statusCode: 404,

      field: "configurationId",
    });
  }

  const beforeUpdate = configuration.toObject();

  const normalizedPayload = normalizePaymentConfigurationPayload(payload);

  const validatedUpdateData = validatePaymentConfigurationData({
    schema: updatePaymentConfigurationSchema,

    data: normalizedPayload,
  });

  const completeData = {
    ...beforeUpdate,

    ...validatedUpdateData,
  };

  /*
    حقول النظام لا تدخل في التحقق الكامل.
    */

  delete completeData._id;

  delete completeData.createdAt;

  delete completeData.updatedAt;

  delete completeData.createdBy;

  delete completeData.updatedBy;

  delete completeData.deletedAt;

  delete completeData.deletedBy;

  delete completeData.isDeleted;

  const completeValidatedData =
    validateCompletePaymentConfiguration(completeData);

  const relationValidatedData = await validatePaymentConfigurationRelations(
    completeValidatedData,
  );

  if (
    relationValidatedData.sectionCode !== configuration.sectionCode ||
    relationValidatedData.paymentMethodCode !== configuration.paymentMethodCode
  ) {
    await ensureUniqueConfiguration({
      sectionCode: relationValidatedData.sectionCode,

      paymentMethodCode: relationValidatedData.paymentMethodCode,

      excludeId: configuration._id,
    });
  }

  Object.entries(relationValidatedData).forEach(([key, value]) => {
    configuration[key] = value;
  });

  configuration.updatedBy = userId || null;

  await configuration.save();

  await createAuditLog({
    req,

    action: AUDIT_ACTIONS.UPDATE,

    entity:
      AUDIT_ENTITIES.PAYMENT_CONFIGURATION,

    entityId: configuration._id,

    before: beforeUpdate,

    after: configuration.toObject(),
  });

  return getPaymentConfigurationByIdService({
    configurationId: configuration._id,
  });
};

/*
=====================================================
Update Payment Configuration Status
=====================================================
*/

export const updatePaymentConfigurationStatusService = async ({
  configurationId,
  payload,
  userId,
  req,
}) => {
  validateObjectId(configurationId, "configurationId");

  const validatedData = validatePaymentConfigurationData({
    schema: updatePaymentConfigurationStatusSchema,

    data: payload,
  });

  const configuration = await PaymentConfiguration.findOne({
    _id: configurationId,

    isDeleted: false,
  });

  if (!configuration) {
    throw createServiceError({
      message: "إعداد الدفع غير موجود",

      statusCode: 404,

      field: "configurationId",
    });
  }

  const beforeUpdate = configuration.toObject();

  /*
    عند التفعيل نعيد التحقق من جميع العلاقات.

    فقد يكون المزود أو الحساب البنكي قد عُطل بعد
    إنشاء الإعداد.
    */

  if (validatedData.isActive) {
    await validatePaymentConfigurationRelations(configuration.toObject());
  }

  configuration.isActive = validatedData.isActive;

  configuration.updatedBy = userId || null;

  await configuration.save();

  await createAuditLog({
    req,

    action:
      AUDIT_ACTIONS.STATUS_CHANGE,

    entity:
      AUDIT_ENTITIES.PAYMENT_CONFIGURATION,

    entityId: configuration._id,

    before: beforeUpdate,

    after: configuration.toObject(),
  });

  return getPaymentConfigurationByIdService({
    configurationId: configuration._id,
  });
};

/*
=====================================================
Delete Payment Configuration
=====================================================

Soft Delete فقط.
=====================================================
*/

export const deletePaymentConfigurationService = async ({
  configurationId,
  userId,
  req,
}) => {
  validateObjectId(configurationId, "configurationId");

  const configuration = await PaymentConfiguration.findOne({
    _id: configurationId,

    isDeleted: false,
  });

  if (!configuration) {
    throw createServiceError({
      message: "إعداد الدفع غير موجود",

      statusCode: 404,

      field: "configurationId",
    });
  }

  const beforeDelete = configuration.toObject();

  configuration.isDeleted = true;

  configuration.isActive = false;

  configuration.deletedAt = new Date();

  configuration.deletedBy = userId || null;

  configuration.updatedBy = userId || null;

  await configuration.save();

  await createAuditLog({
    req,

    action: AUDIT_ACTIONS.DELETE,

    entity:
      AUDIT_ENTITIES.PAYMENT_CONFIGURATION,

    entityId: configuration._id,

    before: beforeDelete,

    after: configuration.toObject(),
  });

  return {
    id: configuration._id,

    message: "تم حذف إعداد الدفع بنجاح",
  };
};
