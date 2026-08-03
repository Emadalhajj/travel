/*

شرح الـController
لماذا نستخدم next(error)؟

بدلًا من تكرار هذا في كل Controller:

res.status(500).json({
  success: false,
  message: error.message,
});

نمرر الخطأ إلى Error Middleware:

next(error);

وهذا يسمح للنظام بالتعامل مع:

400 أخطاء التحقق.
404 السجل غير موجود.
409 تكرار الكود.
500 الأخطاء الداخلية.

من مكان مركزي واحد.

لماذا لم نستخدم req.body مباشرة في Mongoose؟

لا نكتب:

PaymentProvider.create(req.body);

بل نمرره إلى Service:

createPaymentProviderService({
  payload: req.body,
});

لأن Service تقوم بـ:

Normalize.
Joi Validation.
فحص التكرار.
إضافة المستخدم.
تنظيف بيانات Audit.
منع تسريب Credentials.

=====================================================
Payment Provider Controller
=====================================================

مسؤول عن استقبال طلبات HTTP الخاصة بإدارة
مزودي الدفع وتحويلها إلى Payment Provider Service.

مهم:
-----------------------------------------------------
لا نضع منطق الأعمال داخل Controller.

جميع العمليات الأساسية موجودة داخل:

payment-provider-service.js
=====================================================
*/

import {
  getPaymentProvidersService,
  getPaymentProviderByIdService,
  createPaymentProviderService,
  updatePaymentProviderService,
  updatePaymentProviderStatusService,
  deletePaymentProviderService,
} from "../../services/payment/payment-provider-service.js";

/*
=====================================================
Get Current User ID
=====================================================

يدعم أكثر من شكل محتمل لكائن المستخدم حسب
authMiddleware الموجود في المشروع.
=====================================================
*/

const getCurrentUserId = (req) =>
  req.user?._id || req.user?.id || req.userId || null;

/*
=====================================================
Get Payment Providers
=====================================================

GET /api/admin/payment-providers

Query Params:
-----------------------------------------------------
page
limit
search
environment
isActive
sortBy
sortDirection
=====================================================
*/

export const getPaymentProviders = async (req, res, next) => {
  try {
    const result = await getPaymentProvidersService({
      page: req.query.page,

      limit: req.query.limit,

      search: req.query.search,

      environment: req.query.environment,

      isActive: req.query.isActive,

      sortBy: req.query.sortBy,

      sortDirection: req.query.sortDirection,
    });

    return res.status(200).json({
      success: true,

      message: "تم جلب مزودي الدفع بنجاح",

      data: result.items,

      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

/*
=====================================================
Get Payment Provider By ID
=====================================================

GET /api/admin/payment-providers/:providerId
=====================================================
*/

export const getPaymentProviderById = async (req, res, next) => {
  try {
    const provider = await getPaymentProviderByIdService({
      providerId: req.params.providerId,
    });

    return res.status(200).json({
      success: true,

      message: "تم جلب بيانات مزود الدفع بنجاح",

      data: provider,
    });
  } catch (error) {
    return next(error);
  }
};

/*
=====================================================
Create Payment Provider
=====================================================

POST /api/admin/payment-providers
=====================================================
*/

export const createPaymentProvider = async (req, res, next) => {
  try {
    const provider = await createPaymentProviderService({
      payload: req.body,

      userId: getCurrentUserId(req),

      req,
    });

    return res.status(201).json({
      success: true,

      message: "تم إنشاء مزود الدفع بنجاح",

      data: provider,
    });
  } catch (error) {
    return next(error);
  }
};

/*
=====================================================
Update Payment Provider
=====================================================

PATCH /api/admin/payment-providers/:providerId
=====================================================
*/

export const updatePaymentProvider = async (req, res, next) => {
  try {
    const provider = await updatePaymentProviderService({
      providerId: req.params.providerId,

      payload: req.body,

      userId: getCurrentUserId(req),

      req,
    });

    return res.status(200).json({
      success: true,

      message: "تم تحديث مزود الدفع بنجاح",

      data: provider,
    });
  } catch (error) {
    return next(error);
  }
};

/*
=====================================================
Update Payment Provider Status
=====================================================

PATCH /api/admin/payment-providers/:providerId/status

Body:
-----------------------------------------------------
{
  "isActive": true
}
=====================================================
*/

export const updatePaymentProviderStatus = async (req, res, next) => {
  try {
    const provider = await updatePaymentProviderStatusService({
      providerId: req.params.providerId,

      payload: req.body,

      userId: getCurrentUserId(req),

      req,
    });

    return res.status(200).json({
      success: true,

      message: provider.isActive
        ? "تم تفعيل مزود الدفع بنجاح"
        : "تم تعطيل مزود الدفع بنجاح",

      data: provider,
    });
  } catch (error) {
    return next(error);
  }
};

/*
=====================================================
Delete Payment Provider
=====================================================

DELETE /api/admin/payment-providers/:providerId

يتم تنفيذ Soft Delete داخل Service.
=====================================================
*/

export const deletePaymentProvider = async (req, res, next) => {
  try {
    const result = await deletePaymentProviderService({
      providerId: req.params.providerId,

      userId: getCurrentUserId(req),

      req,
    });

    return res.status(200).json({
      success: true,

      message: result.message,

      data: {
        id: result.id,
      },
    });
  } catch (error) {
    return next(error);
  }
};
