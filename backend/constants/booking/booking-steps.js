/*
=====================================================
Booking Steps Constants
=====================================================

هذه الخطوات تمثل رحلة العميل داخل نظام الحجز.

تستخدم في:
-----------------------------------------------------
1- Draft Booking
2- Booking Wizard
3- معرفة أين توقف العميل
4- استكمال الحجز لاحقاً
=====================================================
*/

export const BOOKING_STEPS = {
  PILGRIMS: "pilgrims",
  PROGRAM: "program",
  VISA: "visa",
  TRAVEL: "travel",
  HOTEL: "hotel",
  TRANSPORT: "transport",
  EXTRAS: "extras",
  REVIEW: "review",
  PAYMENT: "payment",
  CONFIRMATION: "confirmation",
};

export const BOOKING_STEPS_LIST = Object.values(BOOKING_STEPS);