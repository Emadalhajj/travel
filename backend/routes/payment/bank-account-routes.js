// routes/payment/bank-account-routes.js

/*
=====================================================
Bank Account Routes
=====================================================
*/

import express from "express";

import {
  protect,
  authorize,
} from "../../middleware/authMiddleware.js";

import {
  getBankAccounts,
  getPublicBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  updateBankAccountStatus,
  deleteBankAccount,
} from "../../controllers/payment/bank-account-controller.js";

const router = express.Router();

/*
=====================================================
Public Route
=====================================================

تستخدم في صفحة الدفع لإظهار الحسابات المسموحة.
لا ترجع إلا الحسابات:
- الفعالة.
- العامة.
- غير المحذوفة.
=====================================================
*/

router.get(
  "/public",
  getPublicBankAccounts,
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
  .get(getBankAccounts)
  .post(createBankAccount);

router
  .route("/:id")
  .get(getBankAccountById)
  .patch(updateBankAccount)
  .delete(deleteBankAccount);

router.patch(
  "/:id/status",
  updateBankAccountStatus,
);

export default router;