/*
=====================================================
Bank Transfer Review Controller
=====================================================

Controller خفيف لاعتماد أو رفض التحويل البنكي.
=====================================================
*/

import asyncHandler from "express-async-handler";

import {
  approveBankTransferService,
  rejectBankTransferService,
} from "../../services/payment/bank-transfer-review-service.js";

export const approveBankTransfer =
  asyncHandler(
    async (req, res) => {
      const result =
        await approveBankTransferService({
          transactionId:
            req.params.id,
          adminUserId:
            req.user?._id || null,
          notes:
            req.body?.notes || "",
          req,
        });

      res.status(200).json({
        success: true,
        message:
          result.alreadyProcessed
            ? "تم اعتماد التحويل مسبقًا"
            : "تم اعتماد التحويل وإنشاء الحجز بنجاح",
        data: {
          transactionId:
            result.transaction._id,
          status: String(
            result.transaction.status || "",
          ).toUpperCase(),
          bookingId:
            result.booking?._id ||
            result.bookingId ||
            result.transaction.booking ||
            null,
        },
      });
    },
  );

export const rejectBankTransfer =
  asyncHandler(
    async (req, res) => {
      const transaction =
        await rejectBankTransferService({
          transactionId:
            req.params.id,
          reason:
            req.body?.reason,
          adminUserId:
            req.user?._id || null,
          req,
        });

      res.status(200).json({
        success: true,
        message:
          "تم رفض التحويل البنكي",
        data: {
          transactionId:
            transaction._id,
          status: String(
            transaction.status || "",
          ).toUpperCase(),
          rejectionReason:
            transaction.rejectionReason ||
            "",
        },
      });
    },
  );
