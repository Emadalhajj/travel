// services/booking/bookingService.js

/*
=====================================================
Booking Service
=====================================================

مسؤول عن الحذف الناعم للحجز وتسجيله في Audit Log.

ملاحظة مهمة:
-----------------------------------------------------
لا نستخدم findByIdAndDelete أو deleteOne.
الحذف يكون Soft Delete فقط.
=====================================================
*/

import Booking from "../../models/booking/booking-model.js";

import AppError from "../../utils/AppError.js";

import { createAuditLog } from "../audit/audit-log-service.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";

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
      "BOOKING_NOT_FOUND",
      404,
      "booking",
    );
  }

  if (booking.isDeleted) {
    throw new AppError(
      "BOOKING_ALREADY_DELETED",
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
