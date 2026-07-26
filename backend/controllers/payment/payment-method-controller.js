// controllers/payment/payment-method-controller.js

/*
=====================================================
Payment Method Controller
=====================================================

الكنترولر مسؤول عن:

- قراءة req.
- التحقق من البيانات.
- استدعاء Service.
- تسجيل Audit Log.
- إرسال Response.

ولا يحتوي منطق قاعدة البيانات الأساسي.
=====================================================
*/

import asyncHandler from "express-async-handler";

import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  updatePaymentMethodStatusSchema,
  validatePaymentMethodData,
} from "../../services/validators/payment/payment-method-validation.js";

import {
  createPaymentMethodService,
  deletePaymentMethodService,
  getPaymentMethodByIdService,
  getPaymentMethodsService,
  getPublicPaymentMethodsService,
  updatePaymentMethodService,
  updatePaymentMethodStatusService,
} from "../../services/payment/payment-method-service.js";

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
Get Admin List
=====================================================
*/

export const getPaymentMethods =
  asyncHandler(
    async (req, res) => {
      const result =
        await getPaymentMethodsService({
          page:
            req.query.page,

          limit:
            req.query.limit,

          search:
            req.query.search,

          type:
            req.query.type,

          isActive:
            req.query.isActive,
        });

      /*
      الاستجابة متوافقة مع نمط inventorySlice:

      action.payload.data
      action.payload.total
      action.payload.page
      action.payload.limit
      action.payload.totalPages
      */

      res.status(200).json({
        success: true,

        data:
          result.data,

        total:
          result.total,

        page:
          result.page,

        limit:
          result.limit,

        totalPages:
          result.totalPages,
      });
    },
  );

/*
=====================================================
Get Public List
=====================================================
*/

export const getPublicPaymentMethods =
  asyncHandler(
    async (req, res) => {
      const methods =
        await getPublicPaymentMethodsService();

      res.status(200).json({
        success: true,
        data: methods,
      });
    },
  );

/*
=====================================================
Get Details
=====================================================
*/

export const getPaymentMethodById =
  asyncHandler(
    async (req, res) => {
      const method =
        await getPaymentMethodByIdService(
          req.params.id,
        );

      res.status(200).json({
        success: true,
        data: method,
      });
    },
  );

/*
=====================================================
Create
=====================================================
*/

export const createPaymentMethod =
  asyncHandler(
    async (req, res) => {
      const validatedData =
        validatePaymentMethodData({
          schema:
            createPaymentMethodSchema,

          data:
            req.body,
        });

      const method =
        await createPaymentMethodService({
          data:
            validatedData,

          userId:
            req.user?._id ||
            null,
        });

      await createAuditLog({
        req,

        action:
          AUDIT_ACTIONS.CREATE,

        entity:
          AUDIT_ENTITIES.PAYMENT_METHOD,

        entityId:
          method._id,

        before: null,

        after:
          method.toObject(),

        metadata: {
          code:
            method.code,

          type:
            method.type,
        },
      });

      res.status(201).json({
        success: true,

        message:
          "تم إنشاء طريقة الدفع بنجاح",

        data:
          method,
      });
    },
  );

/*
=====================================================
Update
=====================================================
*/

export const updatePaymentMethod =
  asyncHandler(
    async (req, res) => {
      const previous =
        await getPaymentMethodByIdService(
          req.params.id,
        );

      const before =
        previous.toObject();

      const validatedData =
        validatePaymentMethodData({
          schema:
            updatePaymentMethodSchema,

          data:
            req.body,
        });

      const method =
        await updatePaymentMethodService({
          methodId:
            req.params.id,

          data:
            validatedData,

          userId:
            req.user?._id ||
            null,
        });

      await createAuditLog({
        req,

        action:
          AUDIT_ACTIONS.UPDATE,

        entity:
          AUDIT_ENTITIES.PAYMENT_METHOD,

        entityId:
          method._id,

        before,

        after:
          method.toObject(),

        metadata: {
          code:
            method.code,
        },
      });

      res.status(200).json({
        success: true,

        message:
          "تم تحديث طريقة الدفع بنجاح",

        data:
          method,
      });
    },
  );

/*
=====================================================
Update Status
=====================================================
*/

export const updatePaymentMethodStatus =
  asyncHandler(
    async (req, res) => {
      const previous =
        await getPaymentMethodByIdService(
          req.params.id,
        );

      const before =
        previous.toObject();

      const validatedData =
        validatePaymentMethodData({
          schema:
            updatePaymentMethodStatusSchema,

          data:
            req.body,
        });

      const method =
        await updatePaymentMethodStatusService({
          methodId:
            req.params.id,

          isActive:
            validatedData.isActive,

          userId:
            req.user?._id ||
            null,
        });

      await createAuditLog({
        req,

        action:
          AUDIT_ACTIONS.STATUS_CHANGE,

        entity:
          AUDIT_ENTITIES.PAYMENT_METHOD,

        entityId:
          method._id,

        before,

        after:
          method.toObject(),

        metadata: {
          field:
            "isActive",
        },
      });

      res.status(200).json({
        success: true,

        message:
          method.isActive
            ? "تم تفعيل طريقة الدفع"
            : "تم تعطيل طريقة الدفع",

        data:
          method,
      });
    },
  );

/*
=====================================================
Delete
=====================================================
*/

export const deletePaymentMethod =
  asyncHandler(
    async (req, res) => {
      const previous =
        await getPaymentMethodByIdService(
          req.params.id,
        );

      const before =
        previous.toObject();

      const method =
        await deletePaymentMethodService({
          methodId:
            req.params.id,

          userId:
            req.user?._id ||
            null,
        });

      await createAuditLog({
        req,

        action:
          AUDIT_ACTIONS.DELETE,

        entity:
          AUDIT_ENTITIES.PAYMENT_METHOD,

        entityId:
          method._id,

        before,

        after:
          method.toObject(),

        metadata: {
          softDelete: true,
          code:
            method.code,
        },
      });

      res.status(200).json({
        success: true,

        message:
          "تم حذف طريقة الدفع بنجاح",
      });
    },
  );
