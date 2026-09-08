// services/payment/payment-method-service.js

/*
=====================================================
Payment Method Service
=====================================================

يحتوي منطق قاعدة البيانات الخاص بطرق الدفع.

المسؤوليات:
-----------------------------------------------------
- جلب القائمة.
- البحث والفلترة.
- إنشاء طريقة.
- تحديث طريقة.
- تغيير التفعيل.
- الحذف المنطقي.
=====================================================
*/

import AppError from "../../utils/AppError.js";

import PaymentMethod from "../../models/payments/payment-method-model.js";

/*
=====================================================
Escape Regex
=====================================================

يمنع تفسير رموز البحث كـRegex Commands.
=====================================================
*/

const escapeRegExp = (
  value = "",
) => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
};

/*
=====================================================
Get Payment Methods
=====================================================
*/

export const getPaymentMethodsService =
  async ({
    page = 1,
    limit = 10,
    search = "",
    type,
    isActive,
  } = {}) => {
    const safePage = Math.max(
      1,
      Number(page) || 1,
    );

    const safeLimit = Math.min(
      100,
      Math.max(
        1,
        Number(limit) || 10,
      ),
    );

    const skip =
      (safePage - 1) *
      safeLimit;

    const filter = {
      isDeleted: false,
    };

    /*
    البحث في:
    - الكود.
    - الاسم العربي.
    - الاسم الإنجليزي.
    */

    if (
      String(search || "").trim()
    ) {
      const safeSearch =
        escapeRegExp(
          String(search).trim(),
        );

      filter.$or = [
        {
          code: {
            $regex:
              safeSearch,

            $options: "i",
          },
        },

        {
          nameAr: {
            $regex:
              safeSearch,

            $options: "i",
          },
        },

        {
          nameEn: {
            $regex:
              safeSearch,

            $options: "i",
          },
        },
      ];
    }

    if (type) {
      filter.type = String(
        type,
      ).toLowerCase();
    }

    if (
      isActive !== undefined &&
      isActive !== ""
    ) {
      filter.isActive =
        String(isActive) ===
        "true";
    }

    const [
      items,
      total,
    ] = await Promise.all([
      PaymentMethod.find(filter)
        .populate(
          "createdBy",
          "name username email",
        )
        .populate(
          "updatedBy",
          "name username email",
        )
        .sort({
          sortOrder: 1,
          createdAt: 1,
        })
        .skip(skip)
        .limit(safeLimit),

      PaymentMethod.countDocuments(
        filter,
      ),
    ]);

    return {
      data: items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages:
        Math.ceil(
          total / safeLimit,
        ),
    };
  };

/*
=====================================================
Get Public Payment Methods
=====================================================

هذه الخدمة ترجع الطرق الفعالة فقط.

ملاحظة:
صفحة العميل النهائية لن تعتمد عليها وحدها؛
لأن Payment Resolver سيطبق ربط القسم والمنتج.
=====================================================
*/

export const getPublicPaymentMethodsService =
  async () => {
    return PaymentMethod.find({
      isDeleted: false,
      isActive: true,
    })
      .select(
        [
          "code",
          "nameAr",
          "nameEn",
          "descriptionAr",
          "descriptionEn",
          "type",
          "requiresBankAccount",
          "requiresPaymentProvider",
          "requiresProofUpload",
          "icon",
          "sortOrder",
        ].join(" "),
      )
      .sort({
        sortOrder: 1,
        createdAt: 1,
      });
  };

/*
=====================================================
Get By ID
=====================================================
*/

export const getPaymentMethodByIdService =
  async (methodId) => {
    const method =
      await PaymentMethod.findOne({
        _id: methodId,
        isDeleted: false,
      })
        .populate(
          "createdBy",
          "name username email",
        )
        .populate(
          "updatedBy",
          "name username email",
        );

    if (!method) {
      throw new AppError(
        "PAYMENT_METHOD_NOT_FOUND",
        404,
        "paymentMethod",
      );
    }

    return method;
  };

/*
=====================================================
Create Payment Method
=====================================================
*/

export const createPaymentMethodService =
  async ({
    data,
    userId,
  }) => {
    const code = String(
      data.code,
    ).toUpperCase();

    const existing =
      await PaymentMethod.findOne({
        code,
        isDeleted: false,
      });

    if (existing) {
      throw new AppError(
        "PAYMENT_METHOD_CODE_DUPLICATE",
        409,
        "code",
      );
    }

    const method =
      await PaymentMethod.create({
        ...data,

        code,

        type: String(
          data.type,
        ).toLowerCase(),

        createdBy:
          userId || null,

        updatedBy:
          userId || null,
      });

    return method;
  };

/*
=====================================================
Update Payment Method
=====================================================
*/

export const updatePaymentMethodService =
  async ({
    methodId,
    data,
    userId,
  }) => {
    const method =
      await PaymentMethod.findOne({
        _id: methodId,
        isDeleted: false,
      });

    if (!method) {
      throw new AppError(
        "PAYMENT_METHOD_NOT_FOUND",
        404,
        "paymentMethod",
      );
    }

    /*
    إذا تغير الكود نتحقق من عدم وجود نسخة أخرى.
    */

    if (
      data.code !== undefined
    ) {
      const code = String(
        data.code,
      ).toUpperCase();

      const duplicate =
        await PaymentMethod.findOne({
          _id: {
            $ne: method._id,
          },

          code,

          isDeleted: false,
        });

      if (duplicate) {
        throw new AppError(
          "PAYMENT_METHOD_CODE_DUPLICATE",
          409,
          "code",
        );
      }

      method.code = code;
    }

    const editableFields = [
      "nameAr",
      "nameEn",
      "descriptionAr",
      "descriptionEn",
      "type",
      "requiresBankAccount",
      "requiresPaymentProvider",
      "requiresProofUpload",
      "icon",
      "sortOrder",
      "isActive",
    ];

    editableFields.forEach(
      (field) => {
        if (
          data[field] !==
          undefined
        ) {
          method[field] =
            data[field];
        }
      },
    );

    if (method.type) {
      method.type = String(
        method.type,
      ).toLowerCase();
    }

    method.updatedBy =
      userId || null;

    await method.save();

    return method;
  };

/*
=====================================================
Update Status
=====================================================
*/

export const updatePaymentMethodStatusService =
  async ({
    methodId,
    isActive,
    userId,
  }) => {
    return updatePaymentMethodService({
      methodId,

      data: {
        isActive,
      },

      userId,
    });
  };

/*
=====================================================
Delete Payment Method
=====================================================

حذف منطقي فقط.

لا نحذف السجل نهائيًا لأن عمليات الدفع القديمة
قد تعتمد على الكود أو المرجع.
=====================================================
*/

export const deletePaymentMethodService =
  async ({
    methodId,
    userId,
  }) => {
    const method =
      await PaymentMethod.findOne({
        _id: methodId,
        isDeleted: false,
      });

    if (!method) {
      throw new AppError(
        "PAYMENT_METHOD_NOT_FOUND",
        404,
        "paymentMethod",
      );
    }

    method.isDeleted = true;
    method.isActive = false;

    method.deletedAt =
      new Date();

    method.deletedBy =
      userId || null;

    method.updatedBy =
      userId || null;

    await method.save();

    return method;
  };