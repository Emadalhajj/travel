// services/vouchers/voucher-service.js

/*
=====================================================
Voucher Service
=====================================================

هذا الملف يحتوي على منطق الفاوتشر الأساسي.

مسؤول عن:
-----------------------------------------------------
- البحث عن الحجز
- منع تكرار إنشاء فاوتشر لنفس الحجز
- توليد رقم الفاوتشر
- إنشاء PDF
- حفظ بيانات الفاوتشر في قاعدة البيانات
- جلب الفاوتشرات
- الحذف الناعم

ملاحظة:
-----------------------------------------------------
الـ controller لا يحتوي business logic.
كل المنطق الحقيقي هنا داخل service.
=====================================================
*/

// import Voucher from "../../models/voucher-model.js";
import Voucher from '../models/voucher-model.js'

import Booking from "../models/booking/booking-model.js";

import { generateVoucherNumber } from "../utils/generateVoucherNumber.js";
import { generateVoucherPdf } from "../services/voucher-pdf-service.js";

// import { VOUCHER_STATUS } from "../../vouchers/voucher-status.js";
import  { VOUCHER_STATUS} from '../constants/voucher-status.js'

/*
=====================================================
createVoucherForBooking
=====================================================

تنشئ فاوتشر لحجز محدد.

الخطوات:
-----------------------------------------------------
1. البحث عن الحجز
2. التأكد أن الحجز غير محذوف
3. التأكد أنه لا يوجد فاوتشر سابق
4. توليد رقم فاوتشر
5. إنشاء PDF
6. حفظ الفاوتشر في قاعدة البيانات
=====================================================
*/
// هي المسؤولة عن إنشاء الفاوتشر كاملًا.
export const createVoucherForBooking = async ({ bookingId, userId }) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    isDeleted: false,
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const existingVoucher = await Voucher.findOne({
    booking: bookingId,
    isDeleted: false,
  });

  if (existingVoucher) {
    return existingVoucher;
  }

  const voucherNumber = generateVoucherNumber();

  const pdfUrl = await generateVoucherPdf({
    voucherNumber,
    booking,
  });

  const voucher = await Voucher.create({
    voucherNumber,

    booking: booking._id,

    customer: {
      name: booking.customer?.name,
      email: booking.customer?.email,
      phone: booking.customer?.phone,
    },

    pdfUrl,

    status: VOUCHER_STATUS.GENERATED,

    generatedBy: userId || null,
  });

  return voucher;
};

/*
=====================================================
getVoucherByBooking
=====================================================

تجلب الفاوتشر الخاص بحجز معين.
=====================================================
*/
// هي المسؤولة عن إنشاء الفاوتشر كاملًا.
export const getVoucherByBooking = async (bookingId) => {
  const voucher = await Voucher.findOne({
    booking: bookingId,
    isDeleted: false,
  }).populate("booking");

  return voucher;
};

/*
=====================================================
getAllVouchers
=====================================================

تجلب كل الفاوتشرات مع pagination.

تستخدم غالبًا في لوحة التحكم.
=====================================================
*/

export const getAllVouchers = async ({ page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const filter = {
    isDeleted: false,
  };

  const [items, total] = await Promise.all([
    Voucher.find(filter)
      .populate("booking")
      .populate("generatedBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Voucher.countDocuments(filter),
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
markVoucherAsSent
=====================================================

تحديث حالة الفاوتشر إلى sent.

تستخدم لاحقًا عند إرسال الفاوتشر بالبريد أو الواتساب.
=====================================================
*/

export const markVoucherAsSent = async (voucherId) => {
  const voucher = await Voucher.findOne({
    _id: voucherId,
    isDeleted: false,
  });

  if (!voucher) {
    throw new Error("Voucher not found");
  }

  voucher.status = VOUCHER_STATUS.SENT;
  voucher.sentAt = new Date();

  await voucher.save();

  return voucher;
};

/*
=====================================================
softDeleteVoucher
=====================================================

حذف ناعم للفاوتشر.

لا يتم حذف السجل من قاعدة البيانات.
فقط يتم تحديث:
-----------------------------------------------------
- isDeleted
- deletedAt
- deletedBy
=====================================================
*/

export const softDeleteVoucher = async ({ voucherId, userId }) => {
  const voucher = await Voucher.findById(voucherId);

  if (!voucher || voucher.isDeleted) {
    throw new Error("Voucher not found");
  }

  voucher.isDeleted = true;
  voucher.deletedAt = new Date();
  voucher.deletedBy = userId || null;

  await voucher.save();

  return voucher;
};
