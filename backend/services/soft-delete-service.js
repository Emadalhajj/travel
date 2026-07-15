// services/soft-delete-service.js

/*
=====================================================
Soft Delete Service
=====================================================

هذا الملف يحتوي منطق الحذف الناعم العام.

مسؤول عن:
-----------------------------------------------------
- اختيار الموديل المناسب حسب اسم resource
- حذف السجل حذفًا ناعمًا
- استرجاع السجل المحذوف
- جلب السجلات المحذوفة

ملاحظة:
-----------------------------------------------------
هذا service عام.
لكن لا نسمح بأي resource إلا من القائمة المسموحة.
=====================================================
*/

import Booking from "../models/booking/booking-model.js";
import DraftBooking from "../models/draft-bookings/draft-booking-model.js";
import Voucher from "../models/voucher-model.js";
import Notification from "../models/notification-model.js";
import Inventory from "../models/inventory-model.js";
import PaymentTransaction from "../models/paymentTransaction-model.js";

import {
  softDeleteDocument,
  restoreDeletedDocument,
} from "../utils/softDelete.js";

/*
=====================================================
MODEL_MAP
=====================================================

خريطة تربط اسم resource بالموديل الحقيقي.

السبب:
-----------------------------------------------------
لا نريد أن يرسل المستخدم أي اسم model من الخارج.
نسمح فقط بالأسماء الموجودة هنا.
=====================================================
*/

const MODEL_MAP = {
  bookings: Booking,
  "draft-bookings": DraftBooking,
  vouchers: Voucher,
  notifications: Notification,
  inventories: Inventory,
  "payment-transactions": PaymentTransaction,
};

/*
=====================================================
getModelByResource
=====================================================

تجلب الموديل المناسب من MODEL_MAP.

إذا كان resource غير مسموح:
-----------------------------------------------------
ترجع خطأ.
=====================================================
*/

const getModelByResource = (resource) => {
  const Model = MODEL_MAP[resource];

  if (!Model) {
    throw new Error("Invalid soft delete resource");
  }

  return Model;
};

/*
=====================================================
softDeleteResource
=====================================================

حذف ناعم لأي resource مدعوم.

الخطوات:
-----------------------------------------------------
1. اختيار الموديل حسب resource
2. البحث عن السجل
3. تنفيذ softDeleteDocument
=====================================================
*/

export const softDeleteResource = async ({ resource, id, userId }) => {
  const Model = getModelByResource(resource);

  const document = await Model.findById(id);

  return softDeleteDocument({
    document,
    userId,
  });
};

/*
=====================================================
restoreResource
=====================================================

استرجاع سجل محذوف حذفًا ناعمًا.

الخطوات:
-----------------------------------------------------
1. اختيار الموديل
2. البحث عن السجل
3. تنفيذ restoreDeletedDocument
=====================================================
*/

export const restoreResource = async ({ resource, id }) => {
  const Model = getModelByResource(resource);

  const document = await Model.findById(id);

  return restoreDeletedDocument({
    document,
  });
};

/*
=====================================================
getDeletedResources
=====================================================

جلب العناصر المحذوفة من resource معين.

تستخدم في لوحة التحكم.
=====================================================
*/

export const getDeletedResources = async ({
  resource,
  page = 1,
  limit = 10,
}) => {
  const Model = getModelByResource(resource);

  const skip = (page - 1) * limit;

  const filter = {
    isDeleted: true,
  };

  const [items, total] = await Promise.all([
    Model.find(filter)
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit),

    Model.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};