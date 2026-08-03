// routes/payment/paymentTransaction-route.js

/*
=====================================================
Payment Transaction Routes
=====================================================

مسارات عمليات الدفع العامة والإدارية.
=====================================================
*/

import express from "express";

import {
  protect,
  authorize,
} from "../../middleware/authMiddleware.js";

import {
  createPaymentTransaction,
  getBookingPayments,
} from "../../controllers/payment/paymentTransaction-controller.js";

import {
  listPaymentTransactions,
  getPaymentTransactionDetails,
  capturePaymentTransaction,
  refundPaymentTransaction,
  cancelPaymentTransaction,
} from "../../controllers/payment/payment-transaction-admin-controller.js";

import {
  getPublicPaymentTransactionStatus,
} from "../../controllers/payment/public-payment-transaction-controller.js";

import {
  approveBankTransfer,
  rejectBankTransfer,
} from "../../controllers/payment/bank-transfer-review-controller.js";

const PaymentTransactionRoute =
  express.Router();

/*
=====================================================
Public Transaction Status
=====================================================
*/

PaymentTransactionRoute.get(
  "/public/payments/:transactionId/status",
  getPublicPaymentTransactionStatus,
);

/*
=====================================================
Create Administrative Transaction
=====================================================
*/

PaymentTransactionRoute.post(
  "/payment-transactions",
  protect,
  authorize("admin", "superAdmin"),
  createPaymentTransaction,
);

/*
=====================================================
Booking Transactions
=====================================================
*/

PaymentTransactionRoute.get(
  "/bookings/:bookingId/payments",
  protect,
  getBookingPayments,
);

/*
=====================================================
Administrative Transaction List
=====================================================
*/

PaymentTransactionRoute.get(
  "/payment-transactions",
  protect,
  authorize("admin", "superAdmin"),
  listPaymentTransactions,
);

/*
=====================================================
Administrative Transaction Details
=====================================================
*/

PaymentTransactionRoute.get(
  "/payment-transactions/:id",
  protect,
  authorize("admin", "superAdmin"),
  getPaymentTransactionDetails,
);

/*
=====================================================
Approve Bank Transfer
=====================================================
*/

PaymentTransactionRoute.patch(
  "/payment-transactions/:id/bank-transfer/approve",
  protect,
  authorize("admin", "superAdmin"),
  approveBankTransfer,
);

/*
=====================================================
Reject Bank Transfer
=====================================================
*/

PaymentTransactionRoute.patch(
  "/payment-transactions/:id/bank-transfer/reject",
  protect,
  authorize("admin", "superAdmin"),
  rejectBankTransfer,
);

/*
=====================================================
Capture Transaction
=====================================================
*/

PaymentTransactionRoute.patch(
  "/payment-transactions/:id/capture",
  protect,
  authorize("admin", "superAdmin"),
  capturePaymentTransaction,
);

/*
=====================================================
Refund Transaction
=====================================================
*/

PaymentTransactionRoute.patch(
  "/payment-transactions/:id/refund",
  protect,
  authorize("admin", "superAdmin"),
  refundPaymentTransaction,
);

/*
=====================================================
Cancel Transaction
=====================================================
*/

PaymentTransactionRoute.patch(
  "/payment-transactions/:id/cancel",
  protect,
  authorize("admin", "superAdmin"),
  cancelPaymentTransaction,
);

export default PaymentTransactionRoute;
