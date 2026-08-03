/*
=====================================================
Payment Configuration Controller
=====================================================

مسؤول عن استقبال الطلبات وتمريرها إلى Service.

لا يحتوي على منطق أعمال.

جميع قواعد:
-----------------------------------------------------
- المزود
- الحساب البنكي
- نوع الإعداد
- التكرار
- التفعيل
- الحذف

موجودة داخل Service.
=====================================================
*/

import asyncHandler from "../../middleware/asyncHandler.js";

import {
  getPaymentConfigurationsService,
  getPaymentConfigurationByIdService,
  createPaymentConfigurationService,
  updatePaymentConfigurationService,
  updatePaymentConfigurationStatusService,
  deletePaymentConfigurationService,
} from "../../services/payment/payment-configuration-service.js";

/*
=====================================================
Resolve User ID
=====================================================

يدعم أكثر من شكل محتمل للمستخدم داخل req.

استخدم الشكل الفعلي الموجود في auth middleware
لديك إن كان معروفًا.
=====================================================
*/

const getRequestUserId = (
  req,
) =>
  req.user?._id ||
  req.user?.id ||
  req.admin?._id ||
  req.admin?.id ||
  null;

/*
=====================================================
Get Payment Configurations
=====================================================

GET /api/payments/configurations

Query:
-----------------------------------------------------
page
limit
search
sectionCode
paymentMethodCode
configurationType
isActive
sortBy
sortDirection
=====================================================
*/

export const getPaymentConfigurations =
  asyncHandler(
    async (req, res) => {
      const result =
        await getPaymentConfigurationsService({
          page:
            req.query.page,

          limit:
            req.query.limit,

          search:
            req.query.search,

          sectionCode:
            req.query.sectionCode,

          paymentMethodCode:
            req.query.paymentMethodCode,

          configurationType:
            req.query.configurationType,

          isActive:
            req.query.isActive,

          sortBy:
            req.query.sortBy,

          sortDirection:
            req.query.sortDirection,
        });

      res.status(200).json({
        success: true,

        message:
          "تم جلب إعدادات الدفع بنجاح",

        data:
          result.items,

        pagination:
          result.pagination,
      });
    },
  );

/*
=====================================================
Get Payment Configuration By ID
=====================================================

GET /api/payments/configurations/:configurationId
=====================================================
*/

export const getPaymentConfigurationById =
  asyncHandler(
    async (req, res) => {
      const configuration =
        await getPaymentConfigurationByIdService({
          configurationId:
            req.params.configurationId,
        });

      res.status(200).json({
        success: true,

        message:
          "تم جلب إعداد الدفع بنجاح",

        data:
          configuration,
      });
    },
  );

/*
=====================================================
Create Payment Configuration
=====================================================

POST /api/payments/configurations
=====================================================
*/

export const createPaymentConfiguration =
  asyncHandler(
    async (req, res) => {
      const configuration =
        await createPaymentConfigurationService({
          payload:
            req.body,

          userId:
            getRequestUserId(req),

          req,
        });

      res.status(201).json({
        success: true,

        message:
          "تم إنشاء إعداد الدفع بنجاح",

        data:
          configuration,
      });
    },
  );

/*
=====================================================
Update Payment Configuration
=====================================================

PATCH /api/payments/configurations/:configurationId
=====================================================
*/

export const updatePaymentConfiguration =
  asyncHandler(
    async (req, res) => {
      const configuration =
        await updatePaymentConfigurationService({
          configurationId:
            req.params.configurationId,

          payload:
            req.body,

          userId:
            getRequestUserId(req),

          req,
        });

      res.status(200).json({
        success: true,

        message:
          "تم تحديث إعداد الدفع بنجاح",

        data:
          configuration,
      });
    },
  );

/*
=====================================================
Update Status
=====================================================

PATCH
/api/payments/configurations/:configurationId/status

Body:
-----------------------------------------------------
{
  isActive: true
}
=====================================================
*/

export const updatePaymentConfigurationStatus =
  asyncHandler(
    async (req, res) => {
      const configuration =
        await updatePaymentConfigurationStatusService({
          configurationId:
            req.params.configurationId,

          payload:
            req.body,

          userId:
            getRequestUserId(req),

          req,
        });

      res.status(200).json({
        success: true,

        message:
          configuration.isActive
            ? "تم تفعيل إعداد الدفع بنجاح"
            : "تم تعطيل إعداد الدفع بنجاح",

        data:
          configuration,
      });
    },
  );

/*
=====================================================
Delete Payment Configuration
=====================================================

DELETE
/api/payments/configurations/:configurationId

Soft Delete.
=====================================================
*/

export const deletePaymentConfiguration =
  asyncHandler(
    async (req, res) => {
      const result =
        await deletePaymentConfigurationService({
          configurationId:
            req.params.configurationId,

          userId:
            getRequestUserId(req),

          req,
        });

      res.status(200).json({
        success: true,

        message:
          result.message,

        data: {
          id:
            result.id,
        },
      });
    },
  );
