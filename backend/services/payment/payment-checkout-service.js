import AppError from "../../utils/AppError.js";
import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import { buildBookingPricingFromDraft } from "../draft-bookings/draft-booking-service.js";

// import { createHyperPayCheckout } from "./hyperpay-service.js";
import { createProviderCheckout } from "./providers/payment-provider-factory.js";

/*
=====================================================
Create Payment Checkout Session Service
=====================================================

هذه الخدمة مسؤولة عن:

1- جلب مسودة الحجز.
2- التحقق من أن المسودة قابلة للدفع.
3- حساب المبلغ من الخادم.
4- إنشاء مرجع دفع داخلي.
5- إرسال الطلب إلى مزود الدفع عن طريق Factory.
=====================================================
*/

export const createPaymentCheckoutSessionService = async ({
  draftId,

  /*
  مؤقتًا نقبل paymentMethod وgateway.
  لاحقًا سيتم استخراج المزود وطريقة الدفع من
  PaymentConfiguration بدلاً من الثقة في الفرونت.
  */
  paymentMethod = "CARD",
  gateway = "HYPERPAY",

  /*
  إعدادات المزود القادمة من قاعدة البيانات مستقبلًا.
  حاليًا يمكن أن تكون null ويستخدم HyperPay fallback.
  */
  providerConfig = null,

  req,
}) => {
  /*
  ---------------------------------------------------
  1- جلب المسودة
  ---------------------------------------------------
  */

  const draft = await DraftBooking.findOne({
    _id: draftId,
    isDeleted: false,
  });

  if (!draft) {
    throw new AppError(
      "مسودة الحجز غير موجودة",
      404,
      "draftBooking",
    );
  }

  /*
  ---------------------------------------------------
  2- التحقق من حالة المسودة
  ---------------------------------------------------
  */

  if (draft.status !== "draft") {
    throw new AppError(
      "لا يمكن الدفع لمسودة غير نشطة",
      400,
      "draftBooking",
    );
  }

  /*
  ---------------------------------------------------
  3- حساب السعر من الخادم
  ---------------------------------------------------

  لا نأخذ amount من الفرونت.
  */

  const pricing = buildBookingPricingFromDraft(draft);

  const amount = Number(
    pricing.totalPrice ||
      pricing.totalAmount ||
      pricing.total ||
      0,
  );

  const currency = pricing.currency || "SAR";

  if (amount <= 0) {
    throw new AppError(
      "مبلغ الدفع غير صحيح",
      400,
      "payment",
    );
  }

  /*
  ---------------------------------------------------
  4- توحيد أسماء الأكواد
  ---------------------------------------------------
  */

  const normalizedPaymentMethod = String(
    paymentMethod || "CARD",
  ).toUpperCase();

  const normalizedProviderCode = String(
    gateway || "HYPERPAY",
  ).toUpperCase();

  /*
  ---------------------------------------------------
  5- إنشاء مرجع دفع داخلي
  ---------------------------------------------------
  */

  const paymentReference =
    `PAY-${Date.now()}-${draft._id}`;

  /*
  ---------------------------------------------------
  6- إنشاء Checkout من المزود
  ---------------------------------------------------

  الخدمة لا تستدعي HyperPay مباشرة.
  بل تمر عبر Payment Provider Factory.
  */

  const checkout = await createProviderCheckout({
    providerCode: normalizedProviderCode,

    amount,
    currency,

    merchantTransactionId: paymentReference,

    customer: draft.customer || {},

    draftId: draft._id,

    providerConfig,
  });

  /*
  ---------------------------------------------------
  7- إعادة النتيجة للكنترولر
  ---------------------------------------------------
  */

  return {
    draftId: draft._id,

    userId:
      draft.user ||
      req?.user?._id ||
      null,

    amount,
    currency,

    paymentMethod: normalizedPaymentMethod,

    providerCode: normalizedProviderCode,

    paymentReference,

    checkoutId: checkout.id,

    checkout,
  };
};