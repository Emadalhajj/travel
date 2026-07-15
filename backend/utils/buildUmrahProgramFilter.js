// utils/buildUmrahProgramFilter.js

/*
=====================================================
Build Umrah Program Filter Utility
=====================================================

هذا الملف يبني فلتر البحث لبرامج العمرة.

يستخدم مع:
-----------------------------------------------------
GET /api/umrah-programs

يدعم البحث حسب:
-----------------------------------------------------
- keyword
- status
- type
- isFeatured
- minPrice
- maxPrice
- startDate
- endDate

ملاحظة:
-----------------------------------------------------
نضيف isDeleted: false حتى لا تظهر البرامج المحذوفة.
=====================================================
*/

export const buildUmrahProgramFilter = (query = {}) => {
  const filter = {
    isDeleted: false,
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.isFeatured !== undefined) {
    filter.isFeatured = query.isFeatured === "true";
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  if (query.minPrice || query.maxPrice) {
    filter["pricing.totalPrice"] = {};

    if (query.minPrice) {
      filter["pricing.totalPrice"].$gte = Number(query.minPrice);
    }

    if (query.maxPrice) {
      filter["pricing.totalPrice"].$lte = Number(query.maxPrice);
    }
  }

  if (query.startDate || query.endDate) {
    filter.startDate = {};

    if (query.startDate) {
      filter.startDate.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      filter.startDate.$lte = new Date(query.endDate);
    }
  }

  const keyword = query.keyword || query.search;

  if (keyword) {
    filter.$or = [
      {
        nameAr: {
          $regex: keyword,
          $options: "i",
        },
      },
      {
        nameEn: {
          $regex: keyword,
          $options: "i",
        },
      },
      {
        descriptionAr: {
          $regex: keyword,
          $options: "i",
        },
      },
      {
        descriptionEn: {
          $regex: keyword,
          $options: "i",
        },
      },
    ];
  }

  return filter;
};
