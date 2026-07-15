/*
=====================================================
Booking Types Constants
=====================================================

أنواع الحجوزات التي يمكن أن يدعمها النظام.

مثال:
-----------------------------------------------------
umrah_package => برنامج عمرة كامل
hotel_only    => حجز فندق فقط
visa_only     => تأشيرة فقط
transport_only => نقل فقط
custom        => حجز مخصص
=====================================================
*/

export const BOOKING_TYPES = {
  UMRAH_PACKAGE: "umrah_package",
  HOTEL_ONLY: "hotel_only",
  VISA_ONLY: "visa_only",
  TRANSPORT_ONLY: "transport_only",
  CUSTOM: "custom",
};

export const BOOKING_TYPES_LIST = Object.values(BOOKING_TYPES);