/*
=====================================================
Public Payment Transaction Controller
=====================================================

يعرض حالة معاملة الدفع للواجهة العامة.
لا يحتوي Business Logic ولا يعيد بيانات داخلية.
=====================================================
*/

import asyncHandler from "express-async-handler";

import {
  getPublicPaymentTransactionStatusService,
} from "../../services/payment/paymentTransaction-service.js";

export const getPublicPaymentTransactionStatus = asyncHandler(
  async (req, res) => {
    const transaction =
      await getPublicPaymentTransactionStatusService({
        transactionId: req.params.transactionId,
      });

    res.status(200).json({
      success: true,
      data: transaction,
    });
  },
);
