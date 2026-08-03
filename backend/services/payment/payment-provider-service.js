/*
=====================================================
Payment Provider Service
=====================================================

تحتوي هذه الخدمة جميع العمليات المتعلقة بإدارة
مزودي الدفع الإلكتروني.

المهام:
-----------------------------------------------------
- List
- Get By ID
- Create
- Update
- Update Status
- Soft Delete
- Resolve Active Provider

مهم:
-----------------------------------------------------
لا يتم إرسال بيانات الاعتماد الحساسة مباشرة إلى
Controller أو Frontend.
=====================================================
*/

import mongoose from "mongoose";

import PaymentProvider from "../../models/payments/payment-provider-model.js";

import {
  createPaymentProviderSchema,
  updatePaymentProviderSchema,
  updatePaymentProviderStatusSchema,
  validatePaymentProviderData,
  validateCompletePaymentProviderCredentials,
} from "../validators/payment/payment-provider-validation.js";

import {
  sanitizePaymentProviderForApi,
  sanitizePaymentProviderForAudit,
} from "../../utils/payments/sanitizePaymentProvider.js";

import {
  createAuditLog,
} from "../audit/audit-log-service.js";

import {
  AUDIT_ACTIONS,
} from "../../constants/audit/audit-actions.js";

import {
  AUDIT_ENTITIES,
} from "../../constants/audit/audit-entities.js";

/*
=====================================================
Credential Select Fields
=====================================================

حقول credentials تحتوي select: false داخل Model.

لذلك عند الحاجة إلى تعديل المزود يجب طلبها
بشكل صريح حتى لا نفقد القيم القديمة أثناء PATCH.
=====================================================
*/

const PAYMENT_PROVIDER_CREDENTIAL_SELECT = [
  "+credentials.entityId",

  "+credentials.accessToken",

  "+credentials.webhookSecret",

  "+credentials.publishableKey",

  "+credentials.secretKey",

  "+credentials.apiKey",

  "+credentials.merchantId",

  "+credentials.terminalId",

  "+credentials.profileId",

  "+credentials.serverKey",

  "+credentials.clientKey",
].join(" ");

/*
=====================================================
Service Error
=====================================================

إنشاء خطأ موحد يمكن أن يتعامل معه Error Middleware
الموجود في المشروع.
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
Validate Mongo ID
=====================================================
*/

const validateObjectId = (
  id,
  field = "id",
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      id,
    )
  ) {
    throw createServiceError({
      message:
        "معرّف مزود الدفع غير صالح",

      statusCode: 400,

      field,
    });
  }
};

/*
=====================================================
Normalize Text
=====================================================
*/

const normalizeString = (
  value,
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
};

/*
=====================================================
Normalize Provider Payload
=====================================================

توحيد البيانات القادمة إلى الخدمة.

الهدف:
-----------------------------------------------------
- إزالة المسافات.
- تحويل code إلى Uppercase.
- تحويل environment إلى Uppercase.
- إزالة طرق الدفع المكررة.
=====================================================
*/

const normalizePaymentProviderPayload =
  (
    payload = {},
  ) => {
    const normalized = {
      ...payload,
    };

    if (
      normalized.code !==
      undefined
    ) {
      normalized.code =
        normalizeString(
          normalized.code,
        ).toUpperCase();
    }

    if (
      normalized.environment !==
      undefined
    ) {
      normalized.environment =
        normalizeString(
          normalized.environment,
        ).toUpperCase();
    }

    if (
      normalized.nameAr !==
      undefined
    ) {
      normalized.nameAr =
        normalizeString(
          normalized.nameAr,
        );
    }

    if (
      normalized.nameEn !==
      undefined
    ) {
      normalized.nameEn =
        normalizeString(
          normalized.nameEn,
        );
    }

    if (
      normalized.descriptionAr !==
      undefined
    ) {
      normalized.descriptionAr =
        normalizeString(
          normalized.descriptionAr,
        );
    }

    if (
      normalized.descriptionEn !==
      undefined
    ) {
      normalized.descriptionEn =
        normalizeString(
          normalized.descriptionEn,
        );
    }

    if (
      normalized.baseUrl !==
      undefined
    ) {
      normalized.baseUrl =
        normalizeString(
          normalized.baseUrl,
        ).replace(/\/+$/, "");
    }

    if (
      normalized.icon !== undefined
    ) {
      normalized.icon =
        normalizeString(
          normalized.icon,
        );
    }

    if (
      Array.isArray(
        normalized.supportedPaymentMethods,
      )
    ) {
      normalized.supportedPaymentMethods =
        [
          ...new Set(
            normalized.supportedPaymentMethods
              .filter(Boolean)
              .map((method) =>
                normalizeString(
                  method,
                ).toUpperCase(),
              ),
          ),
        ];
    }

    if (
      normalized.credentials &&
      typeof normalized.credentials ===
        "object"
    ) {
      normalized.credentials =
        Object.entries(
          normalized.credentials,
        ).reduce(
          (
            result,
            [key, value],
          ) => {
            /*
            لا نحول undefined أو null إلى نص حتى
            نستطيع التفريق بين:

            - حقل لم يتم إرساله.
            - حقل تم إرساله بقيمة فارغة.
            */

            if (
              value === undefined ||
              value === null
            ) {
              return result;
            }

            result[key] =
              normalizeString(value);

            return result;
          },
          {},
        );
    }

    return normalized;
  };

/*
=====================================================
Merge Credentials
=====================================================

عند تعديل مزود الدفع لا يرسل Frontend القيم الحقيقية
للأسرار القديمة.

قد يرسل مثلًا:

credentials: {
  entityId: "********",
  accessToken: "new-token"
}

يجب تجاهل القيمة المقنعة ******** والإبقاء على
القيمة القديمة.

كما لا نريد حذف باقي credentials عند تعديل حقل واحد.
=====================================================
*/

const MASKED_CREDENTIAL_VALUES =
  new Set([
    "********",

    "••••••••",

    "•••••••",

    "[REDACTED]",
  ]);

const mergeProviderCredentials = ({
  existingCredentials = {},
  incomingCredentials,
}) => {
  /*
  إذا لم يرسل المستخدم credentials إطلاقًا
  نعيد القيم القديمة كما هي.
  */

  if (
    !incomingCredentials ||
    typeof incomingCredentials !==
      "object"
  ) {
    return {
      ...existingCredentials,
    };
  }

  const mergedCredentials = {
    ...existingCredentials,
  };

  Object.entries(
    incomingCredentials,
  ).forEach(
    ([key, value]) => {
      /*
      undefined يعني أن الحقل لم يتم تعديله.
      */

      if (value === undefined) {
        return;
      }

      const normalizedValue =
        normalizeString(value);

      /*
      تجاهل القيمة المقنعة القادمة من Frontend.
      */

      if (
        MASKED_CREDENTIAL_VALUES.has(
          normalizedValue,
        )
      ) {
        return;
      }

      /*
      إرسال نص فارغ يعني إزالة الحقل عمدًا.

      نحتفظ بالمفتاح بقيمة فارغة حتى يتمكن
      Validation من اكتشاف أن الحقل المطلوب ناقص.
      */

      mergedCredentials[key] =
        normalizedValue;
    },
  );

  return mergedCredentials;
};

/*
=====================================================
Build Search Query
=====================================================
*/

const buildPaymentProviderFilter =
  ({
    search,
    environment,
    isActive,
  }) => {
    const filter = {
      isDeleted: false,
    };

    if (search) {
      const normalizedSearch =
        normalizeString(search);

      filter.$or = [
        {
          code: {
            $regex:
              normalizedSearch,

            $options: "i",
          },
        },

        {
          nameAr: {
            $regex:
              normalizedSearch,

            $options: "i",
          },
        },

        {
          nameEn: {
            $regex:
              normalizedSearch,

            $options: "i",
          },
        },
      ];
    }

    if (environment) {
      filter.environment =
        normalizeString(
          environment,
        ).toUpperCase();
    }

    if (
      isActive !== undefined &&
      isActive !== ""
    ) {
      filter.isActive =
        String(isActive) ===
        "true";
    }

    return filter;
  };

/*
=====================================================
Get Payment Providers
=====================================================

يدعم:
-----------------------------------------------------
- Search
- Environment Filter
- Active Filter
- Pagination
- Sorting
=====================================================
*/

export const getPaymentProvidersService =
  async ({
    page = 1,
    limit = 10,
    search = "",
    environment = "",
    isActive,
    sortBy = "sortOrder",
    sortDirection = "asc",
  } = {}) => {
    const safePage = Math.max(
      Number(page) || 1,
      1,
    );

    const safeLimit = Math.min(
      Math.max(
        Number(limit) || 10,
        1,
      ),
      100,
    );

    const allowedSortFields =
      new Set([
        "sortOrder",

        "createdAt",

        "updatedAt",

        "nameAr",

        "nameEn",

        "code",

        "environment",
      ]);

    const safeSortBy =
      allowedSortFields.has(
        sortBy,
      )
        ? sortBy
        : "sortOrder";

    const safeSortDirection =
      String(
        sortDirection,
      ).toLowerCase() === "desc"
        ? -1
        : 1;

    const filter =
      buildPaymentProviderFilter({
        search,

        environment,

        isActive,
      });

    const skip =
      (safePage - 1) *
      safeLimit;

    const [
      providers,

      total,
    ] = await Promise.all([
      PaymentProvider.find(filter)
        /*
        لا نستخدم select credentials هنا.

        لذلك لن تعود بيانات الاعتماد الحساسة.
        */

        .sort({
          [safeSortBy]:
            safeSortDirection,

          createdAt: -1,
        })
        .skip(skip)
        .limit(safeLimit)
        .lean(),

      PaymentProvider.countDocuments(
        filter,
      ),
    ]);

    return {
      items: providers.map(
        (provider) =>
          sanitizePaymentProviderForApi(
            provider,
          ),
      ),

      pagination: {
        page: safePage,

        limit: safeLimit,

        total,

        totalPages: Math.ceil(
          total / safeLimit,
        ),

        hasNextPage:
          safePage *
            safeLimit <
          total,

        hasPreviousPage:
          safePage > 1,
      },
    };
  };

/*
=====================================================
Get Payment Provider By ID
=====================================================
*/

export const getPaymentProviderByIdService =
  async ({
    providerId,
    exposeCredentials = false,
  }) => {
    validateObjectId(
      providerId,
      "providerId",
    );

    const query =
      PaymentProvider.findOne({
        _id: providerId,

        isDeleted: false,
      }).select(
        PAYMENT_PROVIDER_CREDENTIAL_SELECT,
      );

    /*
    صفحة الإدارة تحتاج معرفة حالة الحقول حتى تعرض:
    - تم الإعداد
    - غير معد

    لذلك نجلب credentials ثم ننظفها قبل إعادتها.
    */

    const provider =
      await query.exec();

    if (!provider) {
      throw createServiceError({
        message:
          "مزود الدفع غير موجود",

        statusCode: 404,

        field: "providerId",
      });
    }

    /*
    يستخدم فقط داخليًا وليس من Controller.
    */

    if (exposeCredentials) {
      return provider;
    }

    /*
    Controller يستلم نسخة مقنعة مع credentialStatus.
    */

    return sanitizePaymentProviderForApi(
      provider,
    );
  };

/*
=====================================================
Check Duplicate Provider
=====================================================
*/

const ensureUniqueProviderCode =
  async ({
    code,
    excludeId = null,
  }) => {
    const filter = {
      code,

      isDeleted: false,
    };

    if (excludeId) {
      filter._id = {
        $ne: excludeId,
      };
    }

    const existingProvider =
      await PaymentProvider.findOne(
        filter,
      )
        .select("_id code")
        .lean();

    if (existingProvider) {
      throw createServiceError({
        message:
          "يوجد مزود دفع مسجل بنفس الكود",

        statusCode: 409,

        field: "code",

        errors: {
          code:
            "كود مزود الدفع مستخدم مسبقًا",
        },
      });
    }
  };

/*
=====================================================
Create Payment Provider
=====================================================
*/

export const createPaymentProviderService =
  async ({
    payload,
    userId,
    req,
  }) => {
    const normalizedPayload =
      normalizePaymentProviderPayload(
        payload,
      );

    const validatedData =
      validatePaymentProviderData({
        schema:
          createPaymentProviderSchema,

        data: normalizedPayload,

        isUpdate: false,
      });

    await ensureUniqueProviderCode({
      code: validatedData.code,
    });

    const provider =
      await PaymentProvider.create({
        ...validatedData,

        createdBy:
          userId || null,

        updatedBy:
          userId || null,
      });

    /*
    نعيد جلب السجل مع credentials من أجل Audit فقط.

    وبعدها يتم تنظيفها قبل التسجيل.
    */

    const providerWithCredentials =
      await PaymentProvider.findById(
        provider._id,
      ).select(
        PAYMENT_PROVIDER_CREDENTIAL_SELECT,
      );

    await createAuditLog({
      req,

      action:
        AUDIT_ACTIONS.CREATE,

      entity:
        AUDIT_ENTITIES.PAYMENT_PROVIDER,

      entityId:
        provider._id,

      before: null,

      after:
        sanitizePaymentProviderForAudit(
          providerWithCredentials,
        ),
    });

    /*
    لا نعيد providerWithCredentials إلى Controller.
    */

    return sanitizePaymentProviderForApi(
      provider,
    );
  };

/*
=====================================================
Build Complete Provider Data
=====================================================

ينشئ الشكل النهائي للمزود بعد دمج:

- البيانات القديمة.
- بيانات PATCH الجديدة.
- credentials القديمة.
- credentials الجديدة.
=====================================================
*/

const buildCompleteProviderData = ({
  provider,
  validatedUpdateData,
}) => {
  const existingProvider =
    provider.toObject({
      getters: false,

      virtuals: false,
    });

  const mergedCredentials =
    mergeProviderCredentials({
      existingCredentials:
        existingProvider.credentials ||
        {},

      incomingCredentials:
        validatedUpdateData.credentials,
    });

  return {
    ...existingProvider,

    ...validatedUpdateData,

    credentials:
      mergedCredentials,
  };
};

/*
=====================================================
Update Payment Provider
=====================================================
*/

export const updatePaymentProviderService =
  async ({
    providerId,
    payload,
    userId,
    req,
  }) => {
    validateObjectId(
      providerId,
      "providerId",
    );

    const provider =
      await PaymentProvider.findOne({
        _id: providerId,

        isDeleted: false,
      }).select(
        PAYMENT_PROVIDER_CREDENTIAL_SELECT,
      );

    if (!provider) {
      throw createServiceError({
        message:
          "مزود الدفع غير موجود",

        statusCode: 404,

        field: "providerId",
      });
    }

    /*
    حفظ نسخة قبل التعديل لاستخدامها داخل Audit.
    */

    const beforeUpdate =
      provider.toObject({
        getters: false,

        virtuals: false,
      });

    const normalizedPayload =
      normalizePaymentProviderPayload(
        payload,
      );

    /*
    التحقق الأول يتحقق من شكل بيانات PATCH فقط.

    لا نطلب جميع credentials هنا لأن المستخدم قد
    يعدل الاسم فقط.
    */

    const validatedUpdateData =
      validatePaymentProviderData({
        schema:
          updatePaymentProviderSchema,

        data: normalizedPayload,

        isUpdate: true,

        validateCredentials: false,
      });

    const completeProviderData =
      buildCompleteProviderData({
        provider,

        validatedUpdateData,
      });

    /*
    التحقق النهائي بعد دمج البيانات القديمة والجديدة.
    */

    validateCompletePaymentProviderCredentials(
      completeProviderData,
    );

    if (
      validatedUpdateData.code &&
      validatedUpdateData.code !==
        provider.code
    ) {
      await ensureUniqueProviderCode({
        code:
          validatedUpdateData.code,

        excludeId:
          provider._id,
      });
    }

    /*
    نعدل الحقول المرسلة فقط.
    */

    Object.entries(
      validatedUpdateData,
    ).forEach(
      ([key, value]) => {
        if (
          key === "credentials"
        ) {
          return;
        }

        provider[key] = value;
      },
    );

    /*
    لا نستبدل credentials بالكامل بالقيم المرسلة،
    بل بالقيم النهائية بعد الدمج.
    */

    provider.credentials =
      completeProviderData.credentials;

    provider.updatedBy =
      userId || null;

    await provider.save();

    await createAuditLog({
      req,

      action:
        AUDIT_ACTIONS.UPDATE,

      entity:
        AUDIT_ENTITIES.PAYMENT_PROVIDER,

      entityId:
        provider._id,

      before:
        sanitizePaymentProviderForAudit(
          beforeUpdate,
        ),

      after:
        sanitizePaymentProviderForAudit(
          provider,
        ),
    });

    return sanitizePaymentProviderForApi(
      provider,
    );
  };

/*
=====================================================
Update Payment Provider Status
=====================================================
*/

export const updatePaymentProviderStatusService =
  async ({
    providerId,
    payload,
    userId,
    req,
  }) => {
    validateObjectId(
      providerId,
      "providerId",
    );

    const validatedData =
      validatePaymentProviderData({
        schema:
          updatePaymentProviderStatusSchema,

        data: payload,

        validateCredentials: false,
      });

    const provider =
      await PaymentProvider.findOne({
        _id: providerId,

        isDeleted: false,
      }).select(
        PAYMENT_PROVIDER_CREDENTIAL_SELECT,
      );

    if (!provider) {
      throw createServiceError({
        message:
          "مزود الدفع غير موجود",

        statusCode: 404,

        field: "providerId",
      });
    }

    const beforeUpdate =
      provider.toObject({
        getters: false,

        virtuals: false,
      });

    provider.isActive =
      validatedData.isActive;

    provider.updatedBy =
      userId || null;

    await provider.save();

    await createAuditLog({
      req,

      action:
        AUDIT_ACTIONS.STATUS_CHANGE,

      entity:
        AUDIT_ENTITIES.PAYMENT_PROVIDER,

      entityId:
        provider._id,

      before:
        sanitizePaymentProviderForAudit(
          beforeUpdate,
        ),

      after:
        sanitizePaymentProviderForAudit(
          provider,
        ),
    });

    return sanitizePaymentProviderForApi(
      provider,
    );
  };

/*
=====================================================
Delete Payment Provider
=====================================================

Soft Delete فقط.

لا نحذف السجل من قاعدة البيانات لأن العمليات
المالية وسجلات التدقيق قد تشير إليه لاحقًا.
=====================================================
*/

export const deletePaymentProviderService =
  async ({
    providerId,
    userId,
    req,
  }) => {
    validateObjectId(
      providerId,
      "providerId",
    );

    const provider =
      await PaymentProvider.findOne({
        _id: providerId,

        isDeleted: false,
      }).select(
        PAYMENT_PROVIDER_CREDENTIAL_SELECT,
      );

    if (!provider) {
      throw createServiceError({
        message:
          "مزود الدفع غير موجود",

        statusCode: 404,

        field: "providerId",
      });
    }

    const beforeDelete =
      provider.toObject({
        getters: false,

        virtuals: false,
      });

    provider.isDeleted = true;

    provider.isActive = false;

    provider.deletedAt =
      new Date();

    provider.deletedBy =
      userId || null;

    provider.updatedBy =
      userId || null;

    await provider.save();

    await createAuditLog({
      req,

      action:
        AUDIT_ACTIONS.DELETE,

      entity:
        AUDIT_ENTITIES.PAYMENT_PROVIDER,

      entityId:
        provider._id,

      before:
        sanitizePaymentProviderForAudit(
          beforeDelete,
        ),

      after:
        sanitizePaymentProviderForAudit(
          provider,
        ),
    });

    return {
      id: provider._id,

      message:
        "تم حذف مزود الدفع بنجاح",
    };
  };

/*
=====================================================
Get Active Provider By Code
=====================================================

هذه الدالة ليست خاصة بلوحة الإدارة.

ستستخدم داخل:

- Payment Provider Factory
- Payment Resolver
- Checkout Service

تعيد Mongoose Document مع credentials الحقيقية.

يجب ألا يتم استدعاؤها من Controller العام.
=====================================================
*/

export const getActivePaymentProviderByCodeService =
  async ({
    providerCode,
    environment,
  }) => {
    const normalizedCode =
      normalizeString(
        providerCode,
      ).toUpperCase();

    const filter = {
      code: normalizedCode,

      isActive: true,

      isDeleted: false,
    };

    if (environment) {
      filter.environment =
        normalizeString(
          environment,
        ).toUpperCase();
    }

    const provider =
      await PaymentProvider.findOne(
        filter,
      ).select(
        PAYMENT_PROVIDER_CREDENTIAL_SELECT,
      );

    if (!provider) {
      throw createServiceError({
        message:
          `مزود الدفع ${normalizedCode} غير متاح أو غير مفعّل`,

        statusCode: 404,

        field: "providerCode",
      });
    }

    /*
    نتحقق مرة أخرى قبل بدء الدفع حتى لا يعمل مزود
    ناقص الإعدادات.
    */

    validateCompletePaymentProviderCredentials(
      provider.toObject(),
    );

    return provider;
  };
