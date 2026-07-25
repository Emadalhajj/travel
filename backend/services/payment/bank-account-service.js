// services/payment/bank-account-service.js

/*
=====================================================
Bank Account Service
=====================================================

هذا الملف يحتوي منطق الحسابات البنكية.

المسؤوليات:
-----------------------------------------------------
- جلب الحسابات.
- جلب حساب واحد.
- إنشاء حساب.
- تحديث حساب.
- تفعيل وتعطيل الحساب.
- ضمان وجود حساب افتراضي واحد لكل عملة.
- الحذف المنطقي.
=====================================================
*/

import AppError from "../../utils/AppError.js";

import BankAccount from "../../models/payments/bank-account-model.js";

/*
=====================================================
normalizeIban
=====================================================

إزالة المسافات والشرطات وتوحيد الأحرف.
=====================================================
*/

const normalizeIban = (value = "") => {
  return String(value)
    .replace(/[\s-]+/g, "")
    .toUpperCase();
};

/*
=====================================================
ensureSingleDefaultAccount
=====================================================

إذا تم تعيين حساب كحساب افتراضي لعملة معينة،
نلغي الافتراضي عن جميع الحسابات الأخرى
لنفس العملة.

مثال:
-----------------------------------------------------
تم تعيين حساب الراجحي افتراضيًا لـ SAR.

النتيجة:
- الراجحي: isDefault = true
- الأهلي: isDefault = false
- الإنماء: isDefault = false
=====================================================
*/

const ensureSingleDefaultAccount = async ({
  currency,
  excludeAccountId = null,
}) => {
  const filter = {
    currency,
    isDeleted: false,
    isDefault: true,
  };

  if (excludeAccountId) {
    filter._id = {
      $ne: excludeAccountId,
    };
  }

  await BankAccount.updateMany(
    filter,
    {
      $set: {
        isDefault: false,
      },
    },
  );
};

/*
=====================================================
getBankAccountsService
=====================================================

جلب الحسابات للإدارة مع:
- Pagination
- Search
- Currency filter
- Active/Public filters
=====================================================
*/

export const getBankAccountsService = async ({
  page = 1,
  limit = 20,
  search = "",
  currency,
  isActive,
  isPublic,
}) => {
  const safePage = Math.max(
    1,
    Number(page) || 1,
  );

  const safeLimit = Math.min(
    100,
    Math.max(
      1,
      Number(limit) || 20,
    ),
  );

  const skip =
    (safePage - 1) * safeLimit;

  const filter = {
    isDeleted: false,
  };

  /*
  البحث في:
  - اسم البنك
  - اسم الحساب
  - الآيبان
  - رقم الحساب
  */

  if (search) {
    const safeSearch = String(
      search,
    ).trim();

    filter.$or = [
      {
        bankNameAr: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        bankNameEn: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        accountNameAr: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        accountNameEn: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        iban: {
          $regex: normalizeIban(
            safeSearch,
          ),
          $options: "i",
        },
      },
      {
        accountNumber: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  if (currency) {
    filter.currency = String(
      currency,
    ).toUpperCase();
  }

  if (
    isActive !== undefined &&
    isActive !== ""
  ) {
    filter.isActive =
      String(isActive) === "true";
  }

  if (
    isPublic !== undefined &&
    isPublic !== ""
  ) {
    filter.isPublic =
      String(isPublic) === "true";
  }

  const [items, total] =
    await Promise.all([
      BankAccount.find(filter)
        .populate(
          "createdBy",
          "name email",
        )
        .populate(
          "updatedBy",
          "name email",
        )
        .sort({
          isDefault: -1,
          sortOrder: 1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(safeLimit),

      BankAccount.countDocuments(
        filter,
      ),
    ]);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.ceil(
      total / safeLimit,
    ),
  };
};

/*
=====================================================
getPublicBankAccountsService
=====================================================

ترجع فقط الحسابات:
- غير المحذوفة.
- المفعلة.
- الظاهرة للعملاء.
=====================================================
*/

export const getPublicBankAccountsService =
  async ({
    currency = "SAR",
  } = {}) => {
    return BankAccount.find({
      isDeleted: false,
      isActive: true,
      isPublic: true,
      currency: String(
        currency,
      ).toUpperCase(),
    })
      .select(
        [
          "bankNameAr",
          "bankNameEn",
          "accountNameAr",
          "accountNameEn",
          "beneficiaryName",
          "accountNumber",
          "iban",
          "swiftCode",
          "currency",
          "notesAr",
          "notesEn",
          "logo",
          "isDefault",
          "sortOrder",
        ].join(" "),
      )
      .sort({
        isDefault: -1,
        sortOrder: 1,
        createdAt: -1,
      });
  };

/*
=====================================================
getBankAccountByIdService
=====================================================
*/

export const getBankAccountByIdService =
  async (accountId) => {
    const account =
      await BankAccount.findOne({
        _id: accountId,
        isDeleted: false,
      })
        .populate(
          "createdBy",
          "name email",
        )
        .populate(
          "updatedBy",
          "name email",
        );

    if (!account) {
      throw new AppError(
        "الحساب البنكي غير موجود",
        404,
        "bankAccount",
      );
    }

    return account;
  };

/*
=====================================================
createBankAccountService
=====================================================
*/

export const createBankAccountService =
  async ({
    data,
    userId,
  }) => {
    const normalizedIban =
      normalizeIban(data.iban);

    /*
    التحقق يدويًا قبل Mongoose حتى نرجع
    رسالة أوضح من Duplicate Key Error.
    */

    const existingAccount =
      await BankAccount.findOne({
        iban: normalizedIban,
        isDeleted: false,
      });

    if (existingAccount) {
      throw new AppError(
        "رقم الآيبان مستخدم مسبقًا",
        409,
        "iban",
      );
    }

    const currency = String(
      data.currency || "SAR",
    ).toUpperCase();

    if (data.isDefault) {
      await ensureSingleDefaultAccount({
        currency,
      });
    }

    const account =
      await BankAccount.create({
        ...data,

        iban: normalizedIban,

        currency,

        createdBy: userId || null,
        updatedBy: userId || null,
      });

    return account;
  };

/*
=====================================================
updateBankAccountService
=====================================================
*/

export const updateBankAccountService =
  async ({
    accountId,
    data,
    userId,
  }) => {
    const account =
      await BankAccount.findOne({
        _id: accountId,
        isDeleted: false,
      });

    if (!account) {
      throw new AppError(
        "الحساب البنكي غير موجود",
        404,
        "bankAccount",
      );
    }

    if (
      data.iban !== undefined
    ) {
      const normalizedIban =
        normalizeIban(data.iban);

      const duplicate =
        await BankAccount.findOne({
          _id: {
            $ne: account._id,
          },

          iban: normalizedIban,

          isDeleted: false,
        });

      if (duplicate) {
        throw new AppError(
          "رقم الآيبان مستخدم مسبقًا",
          409,
          "iban",
        );
      }

      account.iban =
        normalizedIban;
    }

    /*
    تحديث الحقول المسموح بها فقط.
    */

    const editableFields = [
      "bankNameAr",
      "bankNameEn",
      "accountNameAr",
      "accountNameEn",
      "beneficiaryName",
      "accountNumber",
      "swiftCode",
      "currency",
      "notesAr",
      "notesEn",
      "logo",
      "isActive",
      "isPublic",
      "isDefault",
      "sortOrder",
    ];

    for (
      const field of editableFields
    ) {
      if (
        data[field] !== undefined
      ) {
        account[field] =
          data[field];
      }
    }

    account.currency = String(
      account.currency || "SAR",
    ).toUpperCase();

    /*
    إذا أصبح الحساب افتراضيًا،
    نلغي الافتراضي عن الحسابات الأخرى.
    */

    if (account.isDefault) {
      await ensureSingleDefaultAccount({
        currency:
          account.currency,

        excludeAccountId:
          account._id,
      });
    }

    account.updatedBy =
      userId || null;

    await account.save();

    return account;
  };

/*
=====================================================
updateBankAccountStatusService
=====================================================

خدمة مخصصة للتفعيل والإظهار والحساب الافتراضي.
=====================================================
*/

export const updateBankAccountStatusService =
  async ({
    accountId,
    data,
    userId,
  }) => {
    return updateBankAccountService({
      accountId,
      data,
      userId,
    });
  };

/*
=====================================================
deleteBankAccountService
=====================================================

حذف منطقي للحساب.
لا نحذف الحساب نهائيًا لأن معاملات الدفع القديمة
قد تحتوي مرجعًا له.
=====================================================
*/

export const deleteBankAccountService =
  async ({
    accountId,
    userId,
  }) => {
    const account =
      await BankAccount.findOne({
        _id: accountId,
        isDeleted: false,
      });

    if (!account) {
      throw new AppError(
        "الحساب البنكي غير موجود",
        404,
        "bankAccount",
      );
    }

    account.isDeleted = true;
    account.isActive = false;
    account.isPublic = false;
    account.isDefault = false;

    account.deletedAt =
      new Date();

    account.deletedBy =
      userId || null;

    account.updatedBy =
      userId || null;

    await account.save();

    return account;
  };