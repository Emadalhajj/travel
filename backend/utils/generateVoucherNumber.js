// utils/vouchers/generateVoucherNumber.js

/*
=====================================================
Generate Voucher Number Utility
=====================================================

مسؤول عن توليد رقم فريد للفاوتشر.

شكل الرقم:
-----------------------------------------------------
VCH-2026-1710000000000-4589

يتكون من:
-----------------------------------------------------
- VCH: اختصار Voucher
- السنة الحالية
- الوقت الحالي timestamp
- رقم عشوائي من 4 خانات

الهدف:
-----------------------------------------------------
إنشاء رقم واضح وسهل التتبع لكل فاوتشر.
=====================================================
*/

export const generateVoucherNumber = () => {
  const date = new Date();

  const year = date.getFullYear();

  const timestamp = Date.now();

  const random = Math.floor(1000 + Math.random() * 9000);

  return `VCH-${year}-${timestamp}-${random}`;
};