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
    case "pricing.basePrice_asc":
      return {
        "pricing.basePrice": 1,
      };

    case "price_desc":
    case "pricing.basePrice_desc":
      return {
        "pricing.basePrice": -1,
      };

    case "oldest":
    case "createdAt_asc":
      return {
        createdAt: 1,
      };

    case "start_date":
      return {
        startDate: 1,
      };

    case "newest":
    case "createdAt_desc":
    default:
      return {
        createdAt: -1,
      };
  }
};
