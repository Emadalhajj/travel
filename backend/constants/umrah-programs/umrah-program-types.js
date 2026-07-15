// constants/umrah-programs/umrah-program-types.js

/*
=====================================================
Umrah Program Types Constants
=====================================================

هذا الملف يحتوي على أنواع برامج العمرة.

الأنواع:
-----------------------------------------------------
- ECONOMY: اقتصادي
- STANDARD: عادي
- VIP: فاخر
- RAMADAN: رمضان
- LAND: بري
- AIR: جوي

الهدف:
-----------------------------------------------------
توحيد أنواع البرامج داخل المشروع.
=====================================================
*/

export const UMRAH_PROGRAM_TYPES = {
  ECONOMY: "economy",
  STANDARD: "standard",
  VIP: "vip",
  RAMADAN: "ramadan",
  LAND: "land",
  AIR: "air",
};

export const UMRAH_PROGRAM_TYPES_LIST = Object.values(
  UMRAH_PROGRAM_TYPES,
);