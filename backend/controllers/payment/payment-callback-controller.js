import asyncHandler from "express-async-handler";
import AppError from "../../utils/AppError.js";

import Booking from "../../models/booking/booking-model.js";
import PaymentTransaction from "../../models/payments/paymentTransaction-model.js";

import {
  convertDraftToBooking,
} from "../../services/draft-bookings/draft-booking-service.js";

import {
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

/*
=====================================================
Payment Callback / Webhook
=====================================================

هذه نسخة انتقالية تعمل إلى حين اكتمال التحقق الحقيقي
من HyperPay.

المسؤوليات:
-----------------------------------------------------
1- استقبال مرجع الدفع.
2- جلب PaymentTransaction الموجودة مسبقًا.
3- منع معالجة العملية أكثر من مرة.
4- تحديث حالة العملية.
5- تحويل المسودة إلى حجز بعد نجاح الدفع.
6- ربط المعاملة بالحجز النهائي.
7- تحديث ملخص الدفع داخل الحجز.

مهم:
-----------------------------------------------------
هذه النسخة تقبل status مؤقتًا من الطلب.

بعد اكتمال HyperPay يجب استبدال ذلك بالتحقق من:
- HyperPay result code
- أو Webhook signature
- أو طلب مباشر إلى HyperPay باستخدام checkoutId
=====================================================
*/

export const handlePaymentCallback = asyncHandler(
  async (req, res) => {
    const {
      paymentReference,
      status,
      transactionId,
    } = req.body || {};

    /*
    -------------------------------------------------
    1- التحقق من وجود مرجع الدفع
    -------------------------------------------------
    */

    if (!paymentReference) {
      throw new AppError(
        "paymentReference is required",
        400,
        "paymentReference",
      );
    }

    /*
    -------------------------------------------------
    2- جلب المعاملة التي تم إنشاؤها عند Checkout
    -------------------------------------------------

    لا ننشئ PaymentTransaction جديدة هنا.
    */

    const transaction =
      await PaymentTransaction.findOne({
        gatewayReference: paymentReference,
        isDeleted: false,
      });

    if (!transaction) {
      throw new AppError(
        "Payment transaction not found",
        404,
        "payment",
      );
    }

    /*
    -------------------------------------------------
    3- منع معالجة العملية المدفوعة مرتين
    -------------------------------------------------

    قد يرسل مزود الدفع Callback أو Webhook
    أكثر من مرة للعملية نفسها.
    */

    if (
      transaction.status === "paid" &&
      transaction.booking
    ) {
      const existingBooking =
        await Booking.findById(
          transaction.booking,
        );

      return res.status(200).json({
        success: true,
        message:
          "Payment already processed",

        data: {
          transaction,
          booking: existingBooking,
        },
      });
    }

    /*
    -------------------------------------------------
    4- التحقق المؤقت من حالة الدفع
    -------------------------------------------------

    هذا مؤقت فقط إلى حين إنشاء:
    verifyProviderPayment
    */

    const normalizedStatus = String(
      status || "",
    ).toLowerCase();

    const successfulStatuses = [
      "paid",
      "success",
      "captured",
      "approved",
    ];

    const isPaid =
      successfulStatuses.includes(
        normalizedStatus,
      );

    /*
    -------------------------------------------------
    5- تحديث العملية إذا لم يكن الدفع ناجحًا
    -------------------------------------------------
    */

    if (!isPaid) {
      transaction.status =
        normalizedStatus === "pending"
          ? "pending"
          : "failed";

      transaction.gatewayResponse = {
        ...(transaction.gatewayResponse || {}),
        callbackBody: req.body,
        receivedAt: new Date(),
      };

      await transaction.save();

      return res.status(200).json({
        success: true,

        message:
          "Payment callback received but payment is not successful",

        data: {
          paymentReference:
            transaction.gatewayReference,

          status: transaction.status,
        },
      });
    }

    /*
    -------------------------------------------------
    6- التأكد من أن المعاملة مرتبطة بمسودة
    -------------------------------------------------
    */

    if (!transaction.draftBooking) {
      throw new AppError(
        "Payment transaction is not linked to a draft booking",
        400,
        "draftBooking",
      );
    }

    /*
    -------------------------------------------------
    7- تحديث المعاملة إلى processing
    -------------------------------------------------

    نستخدم processing قبل تحويل المسودة حتى نعرف
    أن العملية دخلت مرحلة إنشاء الحجز.
    */

    transaction.status = "processing";

    transaction.transactionId =
      transactionId ||
      transaction.transactionId ||
      transaction.gatewayReference;

    transaction.gatewayResponse = {
      ...(transaction.gatewayResponse || {}),
      callbackBody: req.body,
      receivedAt: new Date(),
    };

    await transaction.save();

    /*
    -------------------------------------------------
    8- تحويل المسودة إلى حجز
    -------------------------------------------------

    مهم:
    المبلغ وطريقة الدفع والعملة تؤخذ من
    PaymentTransaction المحفوظة، وليس من req.body.
    */

    let conversionResult;

    try {
      conversionResult =
        await convertDraftToBooking({
          draftId:
            transaction.draftBooking,

          userId:
            transaction.user ||
            req.user?._id ||
            null,

          req,

          paymentData: {
            paymentMethod:
              transaction.methodCode,

            paidAmount:
              transaction.amount,

            transactionId:
              transaction.transactionId,

            paymentReference:
              transaction.gatewayReference,

            gateway:
              transaction.providerCode,

            currency:
              transaction.currency,

            /*
            يمكن استخدام هذا الحقل داخل
            convertDraftToBooking لمنع إنشاء
            PaymentTransaction ثانية.
            */
            paymentTransactionId:
              transaction._id,
          },
        });
    } catch (error) {
      /*
      فشل إنشاء الحجز لا يعني بالضرورة أن الدفع فشل.

      لذلك لا نغير الحالة إلى failed؛ لأن العميل
      ربما دفع فعليًا لكن حدث خطأ في المخزون أو
      إنشاء الحجز.

      نستخدم paid_pending_booking حتى تتم معالجة
      الحالة إداريًا.
      */

      transaction.status =
        "paid_pending_booking";

      transaction.gatewayResponse = {
        ...(transaction.gatewayResponse || {}),

        bookingConversionError: {
          message: error.message,
          occurredAt: new Date(),
        },
      };

      await transaction.save();

      throw error;
    }

    const booking =
      conversionResult?.booking ||
      conversionResult;

    if (!booking?._id) {
      transaction.status =
        "paid_pending_booking";

      await transaction.save();

      throw new AppError(
        "Booking conversion did not return a valid booking",
        500,
        "booking",
      );
    }

    /*
    -------------------------------------------------
    9- ربط المعاملة بالحجز النهائي
    -------------------------------------------------
    */

    transaction.booking = booking._id;
    transaction.status = "paid";

    await transaction.save();

    /*
    -------------------------------------------------
    10- تحديث ملخص الدفع داخل الحجز
    -------------------------------------------------
    */

    await applyPaymentSummaryToBooking({
      booking,
      PaymentTransaction,
    });

    /*
    -------------------------------------------------
    11- إعادة النتيجة
    -------------------------------------------------
    */

    res.status(200).json({
      success: true,

      message:
        "Payment processed and booking created successfully",

      data: {
        payment: {
          id: transaction._id,
          status: transaction.status,
          paymentReference:
            transaction.gatewayReference,
          transactionId:
            transaction.transactionId,
          amount: transaction.amount,
          currency: transaction.currency,
          methodCode:
            transaction.methodCode,
          providerCode:
            transaction.providerCode,
        },

        booking,
      },
    });
  },
);
