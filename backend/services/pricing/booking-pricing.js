/*
وهذا الملف مسؤول فقط عن حساب أسعار الحجز النهائية بالاعتماد على أسعار المنتجات المخزنة سابقًا:


*/
// services/booking/booking-pricing.js

/*
=====================================================
Booking Pricing Service
=====================================================

هذا الملف مسؤول عن حساب أسعار الحجز فقط.

المسؤوليات:
-----------------------------------------------------
1- حساب سعر الغرفة باستخدام محرك التسعير الحالي.
2- حساب سعر التأشيرة.
3- حساب سعر الرحلة.
4- حساب سعر النقل إن وجد.
5- حساب الضريبة.
6- حساب الإجمالي النهائي.
7- إنشاء pricing snapshot للحجز.

مهم:
-----------------------------------------------------
لا يقوم هذا الملف بإنشاء الحجز.
لا يقوم هذا الملف بالتحقق من التوفر.
لا يقوم هذا الملف بالتعامل مع response / request.

فقط يستقبل بيانات وموديلات ويرجع pricing object.
=====================================================
*/

import AppError from "../../utils/AppError.js";
import { roundPrice } from "../../utils/roundPrice.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";

/*
=====================================================
Existing Hotel Pricing Engine
=====================================================

نستخدم دالة calculateBookingPrice الموجودة لديك سابقًا
والمستخدمة لحساب سعر الغرفة حسب:

- basePrice
- pricingPeriods
- weekend
- seasonal
- holiday
- discountPercent
- adults
- children
- tax

=====================================================
*/

import { calculateBookingPrice } from "../pricing/index.js";

/*
=====================================================
Constants
=====================================================
*/

const DEFAULT_TAX_RATE = 15;

/*
=====================================================
Helpers
=====================================================
*/

const getLanguage = (req) => {
  return req ? isArabicRequest(req) : true;
};

const toNumber = (value, defaultValue = 0) => {
  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? defaultValue : numberValue;
};

const getPilgrimsCount = (pilgrims = []) => {
  return Array.isArray(pilgrims) && pilgrims.length > 0
    ? pilgrims.length
    : 1;
};

/*
=====================================================
Calculate Room Pricing
=====================================================

هذه الدالة مسؤولة عن حساب سعر الغرفة فقط.

تعتمد على:
- roomTypeId
- checkIn
- checkOut
- adults
- children

وترجع:
- السعر الإجمالي للغرفة
- تفاصيل الليالي
- عدد الليالي
- العملة
=====================================================
*/

export const calculateRoomBookingPricing = async ({
  roomTypeId,
  checkIn,
  checkOut,
  adults = 1,
  children = 0,
  RoomType,
  req = null,
}) => {
  const isArabic = getLanguage(req);

  if (!roomTypeId) {
    return {
      roomPrice: 0,
      roomPricingDetails: null,
      roomType: null,
    };
  }

  const roomType = await RoomType.findById(roomTypeId);

  if (!roomType) {
    throw new AppError(
      "ROOM_TYPE_NOT_FOUND",
      404,
      "roomType",
    );
  }

  if (!checkIn || !checkOut) {
    throw new AppError(
      "ROOM_DATES_REQUIRED",
      400,
      "checkIn",
    );
  }

  const pricingResult = calculateBookingPrice({
    roomType,
    checkIn,
    checkOut,
    adults,
    children,
    taxRate: DEFAULT_TAX_RATE,
  });

  return {
    roomType,

    roomPrice: roundPrice(
      pricingResult?.summary?.totalPrice || 0,
    ),

    roomPricingDetails: pricingResult,

    currency:
      pricingResult?.currency ||
      roomType?.pricing?.currency ||
      "SAR",
  };
};

/*
=====================================================
Calculate Visa Pricing
=====================================================

هذه الدالة تحسب سعر التأشيرات.

السعر في موديل Visa عندك موجود في:

visa.price

ويتم ضربه بعدد المعتمرين.
=====================================================
*/

export const calculateVisaPricing = async ({
  visaId,
  pilgrimsCount = 1,
  Visa,
  req = null,
}) => {
  const isArabic = getLanguage(req);

  if (!visaId) {
    return {
      visa: null,
      visaPrice: 0,
    };
  }

  const visa = await Visa.findById(visaId);

  if (!visa) {
    throw new AppError(
      "VISA_NOT_FOUND",
      404,
      "visa",
    );
  }

  const singleVisaPrice = toNumber(visa.price);

  return {
    visa,

    visaPrice: roundPrice(
      singleVisaPrice * pilgrimsCount,
    ),

    singleVisaPrice,
  };
};

/*
=====================================================
Calculate Trip Pricing
=====================================================

هذه الدالة تحسب سعر الرحلة.

السعر في موديل Trip عندك موجود في:

trip.pricing.basePrice
trip.pricing.discountPrice

القاعدة:
-----------------------------------------------------
إذا يوجد discountPrice أكبر من 0 نستخدمه.
وإلا نستخدم basePrice.

ثم يتم ضرب السعر في عدد المعتمرين.
=====================================================
*/

export const calculateTripPricing = async ({
  tripId,
  pilgrimsCount = 1,
  Trip,
  req = null,
}) => {
  const isArabic = getLanguage(req);

  if (!tripId) {
    return {
      trip: null,
      tripPrice: 0,
    };
  }

  const trip = await Trip.findById(tripId);

  if (!trip) {
    throw new AppError("TRIP_NOT_FOUND",
      404,
      "trip",
    );
  }

  const basePrice = toNumber(
    trip?.pricing?.basePrice,
  );

  const discountPrice = toNumber(
    trip?.pricing?.discountPrice,
  );

  const pricePerPerson =
    discountPrice > 0 ? discountPrice : basePrice;

  return {
    trip,

    tripPrice: roundPrice(
      pricePerPerson * pilgrimsCount,
    ),

    pricePerPerson,
  };
};

/*
=====================================================
Calculate Transport Pricing
=====================================================

موديل Transport الحالي عندك لا يحتوي على pricing.

لذلك حالياً نرجع 0.

لاحقاً إذا أضفت داخل transportSchema:

pricing: {
  basePrice: Number,
  currency: String
}

يمكن تعديل هذه الدالة فقط بدون تغيير باقي النظام.
=====================================================
*/

export const calculateTransportPricing = async ({
  transportId,
  pilgrimsCount = 1,
  Transport,
  req = null,
}) => {
  const isArabic = getLanguage(req);

  if (!transportId) {
    return {
      transport: null,
      transportPrice: 0,
    };
  }

  const transport = await Transport.findById(transportId);

  if (!transport) {
    throw new AppError(
      "TRANSPORT_NOT_FOUND",
      404,
      "transport",
    );
  }

  const basePrice = toNumber(
    transport?.pricing?.basePrice,
  );

  return {
    transport,

    transportPrice: roundPrice(
      basePrice * pilgrimsCount,
    ),

    pricePerPerson: basePrice,
  };
};

/*
=====================================================
Calculate Booking Pricing
=====================================================

هذه هي الدالة الرئيسية.

تستخدم داخل booking-controller عند:
- إنشاء حجز
- تحديث حجز
- معاينة السعر

وتحسب:
- سعر الغرفة
- سعر التأشيرة
- سعر الرحلة
- سعر النقل
- subtotal
- taxAmount
- totalPrice
=====================================================
*/

export const calculateFullBookingPricing = async ({
  data,

  RoomType,
  Visa,
  Trip,
  Transport,

  req = null,
}) => {
  const pilgrimsCount = getPilgrimsCount(
    data.pilgrims,
  );

  /*
  -----------------------------------------------------
  حساب عدد البالغين والأطفال
  -----------------------------------------------------
  حالياً نعتمد على عدد المعتمرين بالكامل كبالغين.
  لاحقاً يمكن تطويرها حسب تاريخ الميلاد.
  */

  const adults =
    data.travelers?.adults ||
    pilgrimsCount;

  const children =
    data.travelers?.children ||
    0;

  /*
  -----------------------------------------------------
  Room Pricing
  -----------------------------------------------------
  */

  const roomPricing =
    await calculateRoomBookingPricing({
      roomTypeId: data.roomType,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      adults,
      children,
      RoomType,
      req,
    });

  /*
  -----------------------------------------------------
  Visa Pricing
  -----------------------------------------------------
  */

  const visaPricing =
    await calculateVisaPricing({
      visaId: data.visa,
      pilgrimsCount,
      Visa,
      req,
    });

  /*
  -----------------------------------------------------
  Trip Pricing
  -----------------------------------------------------
  */

  const tripPricing =
    await calculateTripPricing({
      tripId: data.trip,
      pilgrimsCount,
      Trip,
      req,
    });

  /*
  -----------------------------------------------------
  Transport Pricing
  -----------------------------------------------------
  */

  const transportPricing =
    await calculateTransportPricing({
      transportId: data.transport,
      pilgrimsCount,
      Transport,
      req,
    });

  /*
  -----------------------------------------------------
  Totals
  -----------------------------------------------------
  */

  const roomPrice =
    roomPricing.roomPrice || 0;

  const visaPrice =
    visaPricing.visaPrice || 0;

  const tripPrice =
    tripPricing.tripPrice || 0;

  const transportPrice =
    transportPricing.transportPrice || 0;

  const subtotal = roundPrice(
    roomPrice +
      visaPrice +
      tripPrice +
      transportPrice,
  );

  /*
  -----------------------------------------------------
  Tax
  -----------------------------------------------------
  ملاحظة:
  إذا كان calculateBookingPrice للغرفة يحسب الضريبة مسبقاً،
  يمكنك لاحقاً فصل الضريبة لكل بند.
  
  حالياً نحسب الضريبة على إجمالي الحجز بطريقة موحدة.
  -----------------------------------------------------
  */

  const taxRate =
    toNumber(data?.pricing?.taxRate, DEFAULT_TAX_RATE);

  const taxAmount = roundPrice(
    subtotal * (taxRate / 100),
  );

  const totalPrice = roundPrice(
    subtotal + taxAmount,
  );

  const paidAmount =
    toNumber(data.paidAmount) ||
    toNumber(data?.payment?.paidAmount);

  const remainingAmount = roundPrice(
    totalPrice - paidAmount,
  );

  /*
  -----------------------------------------------------
  Final Pricing Object
  -----------------------------------------------------
  هذا الشكل متوافق مع booking-model.js
  -----------------------------------------------------
  */

  return {
    pricing: {
      roomPrice,
      visaPrice,
      tripPrice,
      transportPrice,

      subtotal,

      taxRate,
      taxAmount,

      totalPrice,

      currency:
        roomPricing.currency ||
        data?.pricing?.currency ||
        "SAR",
    },

    payment: {
      paidAmount,
      remainingAmount,
    },

    /*
    نرجع أيضاً المنتجات الأصلية لبناء snapshots في مسار إنشاء الحجز الحالي.
    */

    docs: {
      roomType: roomPricing.roomType,
      visa: visaPricing.visa,
      trip: tripPricing.trip,
      transport: transportPricing.transport,
    },

    details: {
      roomPricingDetails:
        roomPricing.roomPricingDetails,

      pilgrimsCount,
    },
  };
};

/*
=====================================================
Preview Booking Price
=====================================================

هذه الدالة مخصصة للمعاينة فقط قبل إنشاء الحجز.

يمكن استخدامها في endpoint مثل:

POST /api/bookings/preview-price
=====================================================
*/

export const previewFullBookingPricing =
  calculateFullBookingPricing;
