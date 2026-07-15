// utils/buildUmrahProgramSort.js

/*
=====================================================
Build Umrah Program Sort Utility
=====================================================

هذا الملف يبني طريقة ترتيب برامج العمرة.

يدعم:
-----------------------------------------------------
- السعر من الأقل للأعلى
- السعر من الأعلى للأقل
- الأحدث
- الأقدم
- تاريخ البداية
=====================================================
*/

export const buildUmrahProgramSort = (query = {}) => {
  switch (query.sort) {
    case "price_asc":
      return {
        "pricing.totalPrice": 1,
      };

    case "price_desc":
      return {
        "pricing.totalPrice": -1,
      };

    case "oldest":
      return {
        createdAt: 1,
      };

    case "start_date":
      return {
        startDate: 1,
      };

    case "newest":
    default:
      return {
        createdAt: -1,
      };
  }
};