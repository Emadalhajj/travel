// controllers/vouchers/voucher-controller.js

/*
=====================================================
Voucher Controller
=====================================================

هذا الملف يستقبل الطلبات من route.

مسؤول عن:
-----------------------------------------------------
- قراءة req.body
- قراءة req.params
- قراءة req.query
- استدعاء service المناسب
- إرجاع response

ملاحظة:
-----------------------------------------------------
لا نضع business logic داخل controller.
المنطق الحقيقي يكون داخل service.
=====================================================
*/

import {
  createVoucherForBooking,
  getVoucherByBooking,
  getAllVouchers,
  markVoucherAsSent,
  softDeleteVoucher,
} from "../services/voucher-service.js";

/*
=====================================================
createVoucher
=====================================================

ينشئ فاوتشر لحجز معين.
=====================================================
*/

export const createVoucher = async (req, res, next) => {
  try {
    const voucher = await createVoucherForBooking({
      bookingId: req.body.bookingId,
      userId: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "Voucher generated successfully",
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
getBookingVoucher
=====================================================

يجلب الفاوتشر الخاص بحجز معين.
=====================================================
*/

export const getBookingVoucher = async (req, res, next) => {
  try {
    const voucher = await getVoucherByBooking(req.params.bookingId);

    res.status(200).json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
listVouchers
=====================================================

يعرض قائمة الفاوتشرات للإدارة.
=====================================================
*/

export const listVouchers = async (req, res, next) => {
  try {
    const result = await getAllVouchers({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
setVoucherAsSent
=====================================================

تحديث حالة الفاوتشر إلى sent.
=====================================================
*/

export const setVoucherAsSent = async (req, res, next) => {
  try {
    const voucher = await markVoucherAsSent(req.params.id);

    res.status(200).json({
      success: true,
      message: "Voucher marked as sent successfully",
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
deleteVoucher
=====================================================

حذف ناعم للفاوتشر.
=====================================================
*/

export const deleteVoucher = async (req, res, next) => {
  try {
    const voucher = await softDeleteVoucher({
      voucherId: req.params.id,
      userId: req.user?._id,
    });

    res.status(200).json({
      success: true,
      message: "Voucher deleted successfully",
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};