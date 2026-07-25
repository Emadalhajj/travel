// controllers/payment/bank-account-controller.js

/*
=====================================================
Bank Account Controller
=====================================================

الكنترولر مسؤول فقط عن:
-----------------------------------------------------
- قراءة req.
- استدعاء Validation.
- استدعاء Service.
- تسجيل Audit Log.
- إرسال response.

ولا يحتوي منطق قاعدة البيانات الرئيسي.
=====================================================
*/

import asyncHandler from "express-async-handler";

import {
  createBankAccountSchema,
  updateBankAccountSchema,
  updateBankAccountStatusSchema,
  validateBankAccountData,
} from "../../services/validators/payment/bank-account-validation.js";

import {
  getBankAccountsService,
  getPublicBankAccountsService,
  getBankAccountByIdService,
  createBankAccountService,
  updateBankAccountService,
  updateBankAccountStatusService,
  deleteBankAccountService,
} from "../../services/payment/bank-account-service.js";

import {
  createAuditLog,
} from "../../services/audit/audit-log-service.js";

import {
  AUDIT_ACTIONS,
} from "../../constants/audit/audit-actions.js";

import {
  AUDIT_ENTITIES,
} from "../../constants/audit/audit-entities.js";

/*
=====================================================
getBankAccounts
=====================================================
*/

export const getBankAccounts =
  asyncHandler(
    async (req, res) => {
      const result =
        await getBankAccountsService({
          page: req.query.page,
          limit: req.query.limit,
          search: req.query.search,
          currency:
            req.query.currency,
          isActive:
            req.query.isActive,
          isPublic:
            req.query.isPublic,
        });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
        },
      });
    },
  );

/*
=====================================================
getPublicBankAccounts
=====================================================
*/

export const getPublicBankAccounts =
  asyncHandler(
    async (req, res) => {
      const accounts =
        await getPublicBankAccountsService({
          currency:
            req.query.currency ||
            "SAR",
        });

      res.status(200).json({
        success: true,
        data: accounts,
      });
    },
  );

/*
=====================================================
getBankAccountById
=====================================================
*/

export const getBankAccountById =
  asyncHandler(
    async (req, res) => {
      const account =
        await getBankAccountByIdService(
          req.params.id,
        );

      res.status(200).json({
        success: true,
        data: account,
      });
    },
  );

/*
=====================================================
createBankAccount
=====================================================
*/

export const createBankAccount =
  asyncHandler(
    async (req, res) => {
      const validatedData =
        validateBankAccountData({
          schema:
            createBankAccountSchema,

          data: req.body,
        });

      const account =
        await createBankAccountService({
          data: validatedData,
          userId:
            req.user?._id || null,
        });

      await createAuditLog({
        req,
        action:
          AUDIT_ACTIONS.CREATE,
        entity:
          AUDIT_ENTITIES.BANK_ACCOUNT,
        entityId: account._id,
        before: null,
        after: account.toObject(),
        metadata: {
          currency:
            account.currency,
          bankName:
            account.bankNameAr,
        },
      });

      res.status(201).json({
        success: true,
        message:
          "تم إنشاء الحساب البنكي بنجاح",
        data: account,
      });
    },
  );

/*
=====================================================
updateBankAccount
=====================================================
*/

export const updateBankAccount =
  asyncHandler(
    async (req, res) => {
      const previousAccount =
        await getBankAccountByIdService(
          req.params.id,
        );

      const before =
        previousAccount.toObject();

      const validatedData =
        validateBankAccountData({
          schema:
            updateBankAccountSchema,

          data: req.body,
        });

      const account =
        await updateBankAccountService({
          accountId:
            req.params.id,

          data: validatedData,

          userId:
            req.user?._id || null,
        });

      await createAuditLog({
        req,
        action:
          AUDIT_ACTIONS.UPDATE,
        entity:
          AUDIT_ENTITIES.BANK_ACCOUNT,
        entityId: account._id,
        before,
        after: account.toObject(),
        metadata: {
          currency:
            account.currency,
          bankName:
            account.bankNameAr,
        },
      });

      res.status(200).json({
        success: true,
        message:
          "تم تحديث الحساب البنكي بنجاح",
        data: account,
      });
    },
  );

/*
=====================================================
updateBankAccountStatus
=====================================================
*/

export const updateBankAccountStatus =
  asyncHandler(
    async (req, res) => {
      const previousAccount =
        await getBankAccountByIdService(
          req.params.id,
        );

      const before =
        previousAccount.toObject();

      const validatedData =
        validateBankAccountData({
          schema:
            updateBankAccountStatusSchema,

          data: req.body,
        });

      const account =
        await updateBankAccountStatusService({
          accountId:
            req.params.id,

          data: validatedData,

          userId:
            req.user?._id || null,
        });

      await createAuditLog({
        req,
        action:
          AUDIT_ACTIONS.STATUS_CHANGE,
        entity:
          AUDIT_ENTITIES.BANK_ACCOUNT,
        entityId: account._id,
        before,
        after: account.toObject(),
        metadata: {
          updatedFields:
            Object.keys(
              validatedData,
            ),
        },
      });

      res.status(200).json({
        success: true,
        message:
          "تم تحديث حالة الحساب البنكي",
        data: account,
      });
    },
  );

/*
=====================================================
deleteBankAccount
=====================================================
*/

export const deleteBankAccount =
  asyncHandler(
    async (req, res) => {
      const previousAccount =
        await getBankAccountByIdService(
          req.params.id,
        );

      const before =
        previousAccount.toObject();

      const account =
        await deleteBankAccountService({
          accountId:
            req.params.id,

          userId:
            req.user?._id || null,
        });

      await createAuditLog({
        req,
        action:
          AUDIT_ACTIONS.DELETE,
        entity:
          AUDIT_ENTITIES.BANK_ACCOUNT,
        entityId: account._id,
        before,
        after: account.toObject(),
        metadata: {
          softDelete: true,
        },
      });

      res.status(200).json({
        success: true,
        message:
          "تم حذف الحساب البنكي بنجاح",
      });
    },
  );
