// routes/payment/payment-method-routes.js

/*
=====================================================
Payment Method Routes
=====================================================
*/

import express from "express";

import {
  protect,
  authorize,
} from "../../middleware/authMiddleware.js";

import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethodById,
  getPaymentMethods,
  getPublicPaymentMethods,
  updatePaymentMethod,
  updatePaymentMethodStatus,
} from "../../controllers/payment/payment-method-controller.js";

const router =
  express.Router();

/*
=====================================================
Public Route
=====================================================

هذه القائمة عامة مبدئيًا.

لاحقًا صفحة الدفع ستستخدم Payment Resolver بدل
الاعتماد المباشر على هذه القائمة.
=====================================================
*/

router.get(
  "/public",
  getPublicPaymentMethods,
);

/*
=====================================================
Admin Protection
=====================================================
*/

router.use(protect);

router.use(
  authorize(
    "admin",
    "superAdmin",
  ),
);

/*
=====================================================
Admin Routes
=====================================================
*/

router
  .route("/")
  .get(
    getPaymentMethods,
  )
  .post(
    createPaymentMethod,
  );

router.patch(
  "/:id/status",
  updatePaymentMethodStatus,
);

router
  .route("/:id")
  .get(
    getPaymentMethodById,
  )
  .patch(
    updatePaymentMethod,
  )
  .delete(
    deletePaymentMethod,
  );

export default router;