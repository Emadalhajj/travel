// validators/vouchers/voucher-validation.js

/*
=====================================================
Voucher Validation
=====================================================

ملف التحقق من بيانات طلبات الفاوتشر.

يستخدم قبل دخول الطلب إلى controller.

الهدف:
-----------------------------------------------------
منع وصول بيانات ناقصة أو غير صحيحة إلى service.
=====================================================
*/

import Joi from "joi";

/*
=====================================================
createVoucherValidation
=====================================================

يتحقق من وجود bookingId عند إنشاء فاوتشر.
=====================================================
*/

export const createVoucherValidation = Joi.object({
  bookingId: Joi.string().required().messages({
    "string.empty": "Booking ID is required",
    "any.required": "Booking ID is required",
  }),
});

/*
=====================================================
getVoucherByBookingValidation
=====================================================

يتحقق من bookingId القادم من params.
=====================================================
*/

export const getVoucherByBookingValidation = Joi.object({
  bookingId: Joi.string().required().messages({
    "string.empty": "Booking ID is required",
    "any.required": "Booking ID is required",
  }),
});

/*
=====================================================
voucherIdValidation
=====================================================

يتحقق من id الخاص بالفاوتشر.
=====================================================
*/

export const voucherIdValidation = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "Voucher ID is required",
    "any.required": "Voucher ID is required",
  }),
});