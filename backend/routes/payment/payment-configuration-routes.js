/*
=====================================================
Payment Configuration Routes
=====================================================
*/

import express from "express";

import {
  getPaymentConfigurations,
  getPaymentConfigurationById,
  createPaymentConfiguration,
  updatePaymentConfiguration,
  updatePaymentConfigurationStatus,
  deletePaymentConfiguration,
} from "../../controllers/payment/payment-configuration-controller.js";

/*
استخدم auth middleware الموجود في المشروع.

قد يكون اسمه:
-----------------------------------------------------
protect
authMiddleware
verifyToken
authenticate
adminAuth
=====================================================
*/

import {
  authorize,
  protect,
} from "../../middleware/authMiddleware.js";

const router =
  express.Router();

/*
=====================================================
Authentication
=====================================================

جميع هذه المسارات إدارية.
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

router
  .route("/")
  .get(
    getPaymentConfigurations,
  )
  .post(
    createPaymentConfiguration,
  );

/*
=====================================================
Status Route
=====================================================

يجب أن يأتي قبل /:configurationId
لزيادة الوضوح، رغم أن Express سيميزه أيضًا من خلال
عدد أجزاء المسار.
=====================================================
*/

router.patch(
  "/:configurationId/status",
  updatePaymentConfigurationStatus,
);

/*
=====================================================
Item Routes
=====================================================
*/

router
  .route("/:configurationId")
  .get(
    getPaymentConfigurationById,
  )
  .patch(
    updatePaymentConfiguration,
  )
  .delete(
    deletePaymentConfiguration,
  );

export default router;
