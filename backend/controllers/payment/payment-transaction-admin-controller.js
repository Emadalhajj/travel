/*
=====================================================
Payment Transaction Admin Controller
=====================================================

Controller خفيف لعمليات إدارة معاملات الدفع.
لا يحتوي Business Logic ولا يتعامل مباشرة مع MongoDB.
=====================================================
*/

import asyncHandler from "express-async-handler";

import {
  listPaymentTransactionsAdminService,
  getPaymentTransactionDetailsAdminService,
  capturePaymentTransactionAdminService,
  refundPaymentTransactionAdminService,
  cancelPaymentTransactionAdminService,
} from "../../services/payment/payment-transaction-admin-service.js";

export const listPaymentTransactions =
  asyncHandler(
    async (req, res) => {
      const result =
        await listPaymentTransactionsAdminService({
          page: req.query.page,
          limit: req.query.limit,
          search: req.query.search,
          status: req.query.status,
          paymentMethodCode:
            req.query.paymentMethodCode ||
            req.query.methodCode,
          providerCode:
            req.query.providerCode,
          bookingId:
            req.query.bookingId ||
            req.query.booking,
          draftBookingId:
            req.query.draftBookingId,
          dateFrom:
            req.query.dateFrom,
          dateTo:
            req.query.dateTo,
          sortBy:
            req.query.sortBy,
          sortDirection:
            req.query.sortDirection,
        });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination:
          result.pagination,
      });
    },
  );

export const getPaymentTransactionDetails =
  asyncHandler(
    async (req, res) => {
      const transaction =
        await getPaymentTransactionDetailsAdminService({
          transactionId:
            req.params.id,
        });

      res.status(200).json({
        success: true,
        data: transaction,
      });
    },
  );

export const capturePaymentTransaction =
  asyncHandler(
    async (req, res) => {
      const transaction =
        await capturePaymentTransactionAdminService({
          transactionId:
            req.params.id,
          notes:
            req.body?.notes,
          userId:
            req.user?._id || null,
          req,
        });

      res.status(200).json({
        success: true,
        message:
          "تم تنفيذ Capture للمعاملة بنجاح",
        data: {
          transactionId:
            transaction._id,
          status:
            String(
              transaction.status,
            ).toUpperCase(),
          bookingId:
            transaction.booking ||
            null,
          updatedAt:
            transaction.updatedAt,
        },
      });
    },
  );

export const refundPaymentTransaction =
  asyncHandler(
    async (req, res) => {
      const transaction =
        await refundPaymentTransactionAdminService({
          transactionId:
            req.params.id,
          reason:
            req.body?.reason ||
            req.body?.notes,
          userId:
            req.user?._id || null,
          req,
        });

      res.status(200).json({
        success: true,
        message:
          "تم استرجاع معاملة الدفع بنجاح",
        data: {
          transactionId:
            transaction._id,
          status:
            String(
              transaction.status,
            ).toUpperCase(),
          bookingId:
            transaction.booking ||
            null,
          updatedAt:
            transaction.updatedAt,
        },
      });
    },
  );

export const cancelPaymentTransaction =
  asyncHandler(
    async (req, res) => {
      const transaction =
        await cancelPaymentTransactionAdminService({
          transactionId:
            req.params.id,
          reason:
            req.body?.reason ||
            req.body?.notes,
          userId:
            req.user?._id || null,
          req,
        });

      res.status(200).json({
        success: true,
        message:
          "تم إلغاء معاملة الدفع بنجاح",
        data: {
          transactionId:
            transaction._id,
          status:
            String(
              transaction.status,
            ).toUpperCase(),
          bookingId:
            transaction.booking ||
            null,
          updatedAt:
            transaction.updatedAt,
        },
      });
    },
  );
