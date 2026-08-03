/*
=====================================================
Payment Provider Routes
=====================================================

مسارات إدارة مزودي الدفع الإلكتروني.

Base Route:
-----------------------------------------------------
/api/admin/payment-providers
=====================================================
*/

import express from "express";

import {
  getPaymentProviders,
  getPaymentProviderById,
  createPaymentProvider,
  updatePaymentProvider,
  updatePaymentProviderStatus,
  deletePaymentProvider,
} from "../../controllers/payment/payment-provider-controller.js";

import {
  protect,
  authorize,
} from "../../middleware/authMiddleware.js";

const router = express.Router();

/*
=====================================================
Authentication
=====================================================

جميع مسارات مزودي الدفع خاصة بلوحة الإدارة.

يجب ألا تكون Credentials أو إعدادات المزود
متاحة للمستخدم العام.
=====================================================
*/

router.use(
  protect,
  authorize(
    "admin",
    "superAdmin",
  ),
);

/*
=====================================================
Collection Routes
=====================================================
*/

/*
GET
/api/admin/payment-providers

عرض القائمة مع:
- pagination
- search
- filters
*/

router.get("/", getPaymentProviders);

/*
POST
/api/admin/payment-providers

إنشاء مزود جديد.
*/

router.post("/", createPaymentProvider);

/*
=====================================================
Status Route
=====================================================

يجب وضعه قبل /:providerId لتوضيح المسار
وتجنب أي تعارضات مستقبلية.
=====================================================
*/

/*
PATCH
/api/admin/payment-providers/:providerId/status
*/

router.patch("/:providerId/status", updatePaymentProviderStatus);

/*
=====================================================
Item Routes
=====================================================
*/

/*
GET
/api/admin/payment-providers/:providerId
*/

router.get("/:providerId", getPaymentProviderById);

/*
PATCH
/api/admin/payment-providers/:providerId
*/

router.patch("/:providerId", updatePaymentProvider);

/*
DELETE
/api/admin/payment-providers/:providerId
*/

router.delete("/:providerId", deletePaymentProvider);

export default router;
