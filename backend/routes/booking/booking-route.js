// routes/booking/booking-route.js

/*
=====================================================
Booking Routes
=====================================================

هذا الملف مسؤول فقط عن تعريف مسارات API الخاصة بالحجوزات.

المسؤوليات:
-----------------------------------------------------
1- ربط كل Route بالـ Controller المناسب.
2- تطبيق الحماية protect.
3- تطبيق الصلاحيات authorize.
4- تطبيق Joi validation.
5- الحفاظ على نفس نمط Routes المستخدم في المشروع.

مهم:
-----------------------------------------------------
لا يحتوي هذا الملف على منطق حجز.
لا يحتوي على حساب أسعار.
لا يحتوي على تحقق توفر.
كل ذلك موجود داخل:
controllers/booking/booking-controller.js
services/booking/*
=====================================================
*/

import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";

import { validate } from "../../middleware/validate.js";

import {
  createBookingSchema,
  updateBookingSchema,
} from "../../services/validators/booking-validation.js";

import {
  getAllBookings,
  getMyBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  cancelBooking,
  confirmBooking,
  completeBooking,
  changeBookingStatus,
  changePaymentStatus,
  previewBookingPrice,
} from "../../controllers/booking/booking-controller.js";

/*
=====================================================
Router
=====================================================
*/

const BookingRoute = express.Router();

/*
=====================================================
Public / User Routes
=====================================================

هذه المسارات يستخدمها العميل أو الواجهة الأمامية.

ملاحظة:
-----------------------------------------------------
- preview-price يمكن جعله protected أو public حسب سياستك.
- الأفضل أن يكون protected إذا كان السعر يعتمد على مستخدم.
=====================================================
*/

// معاينة سعر الحجز قبل الحفظ
BookingRoute.post(
  "/bookings/preview-price",
  previewBookingPrice,
);

// حجوزات المستخدم الحالي
BookingRoute.get(
  "/bookings/my-bookings",
  protect,
  getMyBookings,
);

// عرض حجز واحد
BookingRoute.get(
  "/bookings/:id",
  protect,
  getBookingById,
);

// إنشاء حجز جديد
BookingRoute.post(
  "/bookings",
  protect,
  validate(createBookingSchema),
  createBooking,
);

// تحديث حجز
BookingRoute.put(
  "/bookings/:id",
  protect,
  validate(updateBookingSchema),
  updateBooking,
);

// إلغاء حجز
BookingRoute.patch(
  "/bookings/:id/cancel",
  protect,
  cancelBooking,
);

/*
=====================================================
Admin Routes
=====================================================

هذه المسارات خاصة بالإدارة فقط.

تستخدم في لوحة التحكم:
-----------------------------------------------------
- عرض كل الحجوزات
- حذف حجز
- تغيير حالة الحجز
- تغيير حالة الدفع
- تأكيد الحجز
- إكمال الحجز
=====================================================
*/

// عرض كل الحجوزات للإدارة
BookingRoute.get(
  "/bookings",
  protect,
  authorize("admin", "superAdmin"),
  getAllBookings,
);

// حذف حجز
BookingRoute.delete(
  "/bookings/:id",
  protect,
  authorize("admin", "superAdmin"),
  deleteBooking,
);

// تغيير حالة الحجز يدوياً
BookingRoute.patch(
  "/bookings/:id/status",
  protect,
  authorize("admin", "superAdmin"),
  changeBookingStatus,
);

// تغيير حالة الدفع
BookingRoute.patch(
  "/bookings/:id/payment-status",
  protect,
  authorize("admin", "superAdmin"),
  changePaymentStatus,
);

// تأكيد الحجز
BookingRoute.patch(
  "/bookings/:id/confirm",
  protect,
  authorize("admin", "superAdmin"),
  confirmBooking,
);

// إكمال الحجز
BookingRoute.patch(
  "/bookings/:id/complete",
  protect,
  authorize("admin", "superAdmin"),
  completeBooking,
);

export default BookingRoute;