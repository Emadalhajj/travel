// routes/vouchers/voucher-route.js

/*
=====================================================
Voucher Routes
=====================================================

مسارات الفاوتشر / PDF.

المستخدم أو الإدارة:
-----------------------------------------------------
- إنشاء فاوتشر لحجز
- عرض فاوتشر حجز معين

الإدارة:
-----------------------------------------------------
- عرض جميع الفاوتشرات
- تعليم الفاوتشر أنه تم إرساله
- حذف الفاوتشر حذفًا ناعمًا

ملاحظة:
-----------------------------------------------------
يمكن لاحقًا ربط إنشاء الفاوتشر تلقائيًا بعد الدفع الناجح.
=====================================================
*/

import express from "express";

import { protect, authorize } from "../middleware/authMiddleware.js";

import {
  createVoucher,
  getBookingVoucher,
  listVouchers,
  setVoucherAsSent,
  deleteVoucher,
} from "../controllers/voucher-controller.js";

const VoucherRoute = express.Router();

/*
=====================================================
Create Voucher
=====================================================

إنشاء فاوتشر لحجز معين.

Body:
-----------------------------------------------------
{
  "bookingId": "..."
}
=====================================================
*/

VoucherRoute.post(
  "/vouchers",
  protect,
  authorize("admin", "superAdmin"),
  createVoucher,
);

/*
=====================================================
Get Voucher By Booking
=====================================================

جلب الفاوتشر الخاص بحجز معين.
=====================================================
*/

VoucherRoute.get(
  "/vouchers/booking/:bookingId",
  protect,
  getBookingVoucher,
);

/*
=====================================================
Get All Vouchers
=====================================================

عرض جميع الفاوتشرات للإدارة.
=====================================================
*/

VoucherRoute.get(
  "/vouchers",
  protect,
  authorize("admin", "superAdmin"),
  listVouchers,
);

/*
=====================================================
Mark Voucher As Sent
=====================================================

تحديث حالة الفاوتشر إلى sent.
=====================================================
*/

VoucherRoute.patch(
  "/vouchers/:id/sent",
  protect,
  authorize("admin", "superAdmin"),
  setVoucherAsSent,
);

/*
=====================================================
Soft Delete Voucher
=====================================================

حذف الفاوتشر حذفًا ناعمًا.
=====================================================
*/

VoucherRoute.delete(
  "/vouchers/:id",
  protect,
  authorize("admin", "superAdmin"),
  deleteVoucher,
);

export default VoucherRoute;