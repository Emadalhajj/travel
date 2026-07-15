// services/booking/bookingService.js

/*
=====================================================
Booking Service
=====================================================

هذا الملف يحتوي منطق الحجوزات الأساسي.

مسؤول عن:
-----------------------------------------------------
- إنشاء حجز
- جلب الحجوزات
- جلب حجز واحد
- تحديث حجز
- تحديث حالة الحجز
- حذف الحجز حذفًا ناعمًا
- استرجاع الحجز المحذوف
- جلب الحجوزات المحذوفة

ملاحظة مهمة:
-----------------------------------------------------
لا نستخدم findByIdAndDelete أو deleteOne.
الحذف يكون Soft Delete فقط.
=====================================================
*/

import Booking from "../../models/booking/booking-model.js";

import { buildNotDeletedFilter } from "../../utils/buildNotDeletedFilter.js";
import AppError from "../../utils/AppError.js";
import {
  softDeleteDocument,
  restoreDeletedDocument,
} from "../../utils/softDelete.js";

import { createAuditLog } from "../audit/audit-log-service.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";

/*
=====================================================
createBooking
=====================================================

إنشاء حجز جديد.

البيانات تأتي من controller.
=====================================================
*/

export const createBooking = async ({ data, userId }) => {
  const booking = await Booking.create({
    ...data,

    createdBy: userId || data.createdBy || null,

    isDeleted: false,
  });

  return booking;
};

/*
=====================================================
getAllBookings
=====================================================

جلب جميع الحجوزات غير المحذوفة.

نستخدم buildNotDeletedFilter حتى لا تظهر الحجوزات
المحذوفة حذفًا ناعمًا في النتائج.
=====================================================
*/

export const getAllBookings = async ({
  page = 1,
  limit = 10,
  status,
  paymentStatus,
  bookingType,
  search,
}) => {
  const skip = (page - 1) * limit;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  if (bookingType) {
    filter.bookingType = bookingType;
  }

  if (search) {
    filter.$or = [
      { bookingNumber: { $regex: search, $options: "i" } },
      { bookingId: { $regex: search, $options: "i" } },
      { "customer.name": { $regex: search, $options: "i" } },
      { "customer.email": { $regex: search, $options: "i" } },
      { "customer.phone": { $regex: search, $options: "i" } },
    ];
  }

  const finalFilter = buildNotDeletedFilter(filter);

  const [items, total] = await Promise.all([
    Booking.find(finalFilter)
      .populate("user", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Booking.countDocuments(finalFilter),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/*
=====================================================
getBookingById
=====================================================

جلب حجز واحد بشرط أن لا يكون محذوفًا.

بدل:
-----------------------------------------------------
Booking.findById(id)

نستخدم:
-----------------------------------------------------
Booking.findOne({ _id: id, isDeleted: false })
=====================================================
*/

export const getBookingById = async (bookingId) => {
  const booking = await Booking.findOne(
    buildNotDeletedFilter({
      _id: bookingId,
    }),
  )
    .populate("user", "name email role")
    .populate("createdBy", "name email role");

  if (!booking) {
    throw new Error("Booking not found");
  }

  return booking;
};

/*
=====================================================
getMyBookings
=====================================================

جلب حجوزات المستخدم الحالي فقط.

تستخدم في واجهة العميل.
=====================================================
*/

export const getMyBookings = async ({ userId, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const filter = buildNotDeletedFilter({
    user: userId,
  });

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Booking.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/*
=====================================================
updateBooking
=====================================================

تحديث بيانات الحجز.

لا نحدث الحجز إذا كان محذوفًا.
=====================================================
*/

export const updateBooking = async ({ bookingId, data }) => {
  const booking = await Booking.findOne(
    buildNotDeletedFilter({
      _id: bookingId,
    }),
  );

  if (!booking) {
    throw new Error("Booking not found");
  }

  Object.assign(booking, data);

  await booking.save();

  return booking;
};

/*
=====================================================
updateBookingStatus
=====================================================

تحديث حالة الحجز فقط.

مثال:
-----------------------------------------------------
pending -> confirmed
confirmed -> completed
=====================================================
*/

export const updateBookingStatus = async ({
  bookingId,
  status,
  req,
}) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    isDeleted: false,
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const before = booking.toObject();

  booking.status = status;

  await booking.save();

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: AUDIT_ENTITIES.BOOKING,
    entityId: booking._id,
    before,
    after: booking.toObject(),
  });

  return booking;
};

/*
=====================================================
updateBookingPaymentStatus
=====================================================

تحديث حالة الدفع فقط.

مثال:
-----------------------------------------------------
pending -> paid
paid -> refunded
=====================================================
*/

export const updateBookingPaymentStatus = async ({
  bookingId,
  paymentStatus,
}) => {
  const booking = await Booking.findOne(
    buildNotDeletedFilter({
      _id: bookingId,
    }),
  );

  if (!booking) {
    throw new Error("Booking not found");
  }

  booking.paymentStatus = paymentStatus;

  await booking.save();

  return booking;
};

/*
=====================================================
softDeleteBooking
=====================================================

حذف الحجز حذفًا ناعمًا.

لا نحذف السجل من قاعدة البيانات.
فقط يتم تحديث:
-----------------------------------------------------
- isDeleted
- deletedAt
- deletedBy
=====================================================
*/

/*
=====================================================
softDeleteBooking
=====================================================

حذف الحجز حذفًا ناعمًا.

هذه الدالة هي التي تتعامل مع Booking Model.

الخطوات:
-----------------------------------------------------
1. البحث عن الحجز بواسطة id
2. التأكد أن الحجز موجود
3. أخذ نسخة من الحجز قبل الحذف لتسجيلها في Audit Log
4. تحديث isDeleted / deletedAt / deletedBy
5. تسجيل العملية في Audit Log
6. إرجاع الحجز بعد الحذف
=====================================================
*/

export const softDeleteBooking = async ({ bookingId, userId, req }) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError(
      "Booking not found",
      404,
      "booking",
    );
  }

  if (booking.isDeleted) {
    throw new AppError(
      "Booking already deleted",
      400,
      "booking",
    );
  }

  const before = booking.toObject();

  booking.isDeleted = true;
  booking.deletedAt = new Date();
  booking.deletedBy = userId || null;

  await booking.save();

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.DELETE,
    entity: AUDIT_ENTITIES.BOOKING,
    entityId: booking._id,
    before,
    after: booking.toObject(),
    metadata: {
      reason: "Soft delete booking",
    },
  });

  return booking;
};
/*
=====================================================
restoreBooking
=====================================================

استرجاع حجز محذوف حذفًا ناعمًا.
=====================================================
*/

export const restoreBooking = async ({ bookingId }) => {
  const booking = await Booking.findById(bookingId);

  return restoreDeletedDocument({
    document: booking,
  });
};

/*
=====================================================
getDeletedBookings
=====================================================

جلب الحجوزات المحذوفة فقط.

تستخدم في لوحة التحكم.
=====================================================
*/

export const getDeletedBookings = async ({ page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const filter = {
    isDeleted: true,
  };

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate("deletedBy", "name email role")
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit),

    Booking.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};
