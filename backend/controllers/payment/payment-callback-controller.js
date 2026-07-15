import asyncHandler from "express-async-handler";
import AppError from "../../utils/AppError.js";

import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import Booking from "../../models/booking/booking-model.js";
import PaymentTransaction from "../../models/paymentTransaction-model.js";

import { convertDraftToBooking } from "../../services/draft-bookings/draft-booking-service.js";
import {
  createPaymentTransactionService,
  applyPaymentSummaryToBooking,
} from "../../services/payment/paymentTransaction-service.js";

/*
=====================================================
Payment Callback / Webhook
=====================================================
هذه الدالة يتم استدعاؤها بعد رجوع بوابة الدفع بنتيجة العملية.

مهم:
- في الربط الحقيقي يجب التحقق من توقيع البوابة Signature.
- لا تعتمد على success القادم من الفرونت.
- لا تعتمد على amount القادم من الفرونت.
=====================================================
*/

export const handlePaymentCallback = asyncHandler(async (req, res) => {
  const {
    draftId,
    paymentReference,
    gateway,
    status,
    amount,
    currency,
    transactionId,
    method,
  } = req.body || {};

  if (!draftId) {
    throw new AppError("draftId is required", 400, "draftId");
  }

  if (!paymentReference) {
    throw new AppError("paymentReference is required", 400, "paymentReference");
  }

  /*
  مؤقتًا:
  نقبل status = paid أو success.
  لاحقًا مع HyperPay / PayTabs:
  يجب التحقق من signature والـ resultCode.
  */

  const isPaid = ["paid", "success", "captured", "approved"].includes(
    String(status || "").toLowerCase(),
  );

  if (!isPaid) {
    return res.status(200).json({
      success: true,
      message: "Payment callback received but payment is not successful",
      data: {
        draftId,
        paymentReference,
        status,
      },
    });
  }

  const draft = await DraftBooking.findById(draftId);

  if (!draft) {
    throw new AppError("Draft booking not found", 404, "draftBooking");
  }

  /*
  منع تكرار إنشاء الحجز:
  لأن بوابات الدفع قد ترسل Webhook أكثر من مرة.
  */

  if (draft.status === "completed" && draft.finalBooking) {
    const existingBooking = await Booking.findById(draft.finalBooking);

    return res.status(200).json({
      success: true,
      message: "Payment already processed",
      data: {
        booking: existingBooking,
      },
    });
  }

  /*
  تحويل المسودة إلى حجز فعلي.
  هذه الدالة يجب أن تقوم بـ:
  - التحقق من المخزون
  - حجز المخزون
  - إنشاء Booking
  - إنشاء Logs
  - إنشاء Voucher
  */

const conversionResult = await convertDraftToBooking({
  draftId: draft._id,
  userId: draft.user,
  req,
  paymentData: {
    paymentMethod: method || "card",
    paidAmount: Number(amount || 0),
    transactionId: transactionId || paymentReference,
    paymentReference,
    gateway,
    currency: currency || "SAR",
  },
});
  const booking = conversionResult?.booking || conversionResult;

  /*
  تسجيل PaymentTransaction بعد إنشاء الحجز.
  إذا كانت convertDraftToBooking عندك تنشئ PaymentTransaction داخليًا،
  احذف هذا الجزء لتجنب التكرار.
  */

  const existingPayment = await PaymentTransaction.findOne({
    gatewayReference: paymentReference,
  });

//   if (!existingPayment) {
//     await createPaymentTransactionService({
//       Booking,
//       PaymentTransaction,
//       data: {
//         booking: booking._id,
//         amount: Number(amount || booking?.pricing?.totalAmount || 0),
//         currency: currency || booking?.pricing?.currency || "SAR",
//         method: method || "card",
//         status: "paid",
//         transactionId: transactionId || paymentReference,
//         gateway,
//         gatewayReference: paymentReference,
//         notes: "Payment confirmed by gateway callback",
//       },
//       req,
//     });

//     await applyPaymentSummaryToBooking({
//       booking,
//       PaymentTransaction,
//     });
//   }

  res.status(200).json({
    success: true,
    message: "Payment processed and booking created successfully",
    data: {
      booking,
    },
  });
});
