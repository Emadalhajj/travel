// constants/umrah-programs/umrah-program-status.js

/*
=====================================================
Umrah Program Status Constants
=====================================================

هذا الملف يحتوي على حالات برنامج العمرة.

الحالات:
-----------------------------------------------------
- DRAFT: البرنامج ما زال مسودة داخل لوحة التحكم
- ACTIVE: البرنامج ظاهر ومتاح للحجز
- INACTIVE: البرنامج غير ظاهر أو متوقف مؤقتًا
- SOLD_OUT: البرنامج مكتمل العدد
- EXPIRED: انتهى تاريخ البرنامج

الهدف:
-----------------------------------------------------
توحيد حالات البرامج بدل كتابتها يدويًا داخل أكثر من ملف.
=====================================================
*/

export const UMRAH_PROGRAM_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  INACTIVE: "inactive",
  SOLD_OUT: "sold_out",
  EXPIRED: "expired",
};

export const UMRAH_PROGRAM_STATUS_LIST = Object.values(
  UMRAH_PROGRAM_STATUS,
);