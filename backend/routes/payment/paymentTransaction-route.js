// routes/payment/paymentTransaction-route.js

/*
=====================================================
Payment Transaction Routes
=====================================================

مسارات عمليات الدفع.

هذه المسارات تستخدم في:
-----------------------------------------------------
- تسجيل دفعة جديدة.
- عرض دفعات حجز معين.
- عرض كل العمليات للإدارة.
- استرجاع دفعة.
=====================================================
*/

import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";

import {
  createPaymentTransaction,
  getBookingPayments,
  getAllPaymentTransactions,
  refundPaymentTransaction,
} from "../../controllers/payment/paymentTransaction-controller.js";

const PaymentTransactionRoute = express.Router();

PaymentTransactionRoute.post(
  "/payment-transactions",
  protect,
  authorize("admin", "superAdmin"),
  createPaymentTransaction,
);

PaymentTransactionRoute.get(
  "/bookings/:bookingId/payments",
  protect,
  getBookingPayments,
);

PaymentTransactionRoute.get(
  "/payment-transactions",
  protect,
  authorize("admin", "superAdmin"),
  getAllPaymentTransactions,
);

PaymentTransactionRoute.patch(
  "/payment-transactions/:id/refund",
  protect,
  authorize("admin", "superAdmin"),
  refundPaymentTransaction,
);

export default PaymentTransactionRoute;