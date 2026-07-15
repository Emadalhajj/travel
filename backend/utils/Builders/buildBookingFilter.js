// utils/Builders/buildBookingFilter.js

/*
=====================================================
Build Booking Filter
=====================================================

هذا الملف مسؤول عن بناء فلتر البحث للحجوزات.

يستخدم داخل:
controllers/booking/booking-controller.js

في دالة:
getAllBookings

المسؤوليات:
-----------------------------------------------------
1- البحث برقم الحجز.
2- البحث بحالة الحجز.
3- البحث بحالة الدفع.
4- الفلترة حسب المستخدم.
5- الفلترة حسب الفندق.
6- الفلترة حسب نوع الغرفة.
7- الفلترة حسب التأشيرة.
8- الفلترة حسب الرحلة.
9- الفلترة حسب النقل.
10- الفلترة حسب تاريخ الإنشاء.
11- الفلترة حسب تواريخ الوصول والمغادرة.

مهم:
-----------------------------------------------------
هذا الملف لا ينفذ query.
فقط يرجع MongoDB filter object.
=====================================================
*/

import mongoose from "mongoose";

/*
=====================================================
Helpers
=====================================================
*/

const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(id);
};

const normalizeDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
};

const startOfDay = (date) => {
  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);

  d.setHours(23, 59, 59, 999);

  return d;
};

/*
=====================================================
Build Date Range Filter
=====================================================

هذه الدالة تبني فلتر للتواريخ.

مثال:
createdFrom=2026-01-01
createdTo=2026-01-31

يرجع:
{
  createdAt: {
    $gte: 2026-01-01,
    $lte: 2026-01-31
  }
}
*/

const buildDateRangeFilter = ({
  field,
  from,
  to,
}) => {
  const filter = {};

  const fromDate = normalizeDate(from);

  const toDate = normalizeDate(to);

  if (fromDate || toDate) {
    filter[field] = {};

    if (fromDate) {
      filter[field].$gte =
        startOfDay(fromDate);
    }

    if (toDate) {
      filter[field].$lte =
        endOfDay(toDate);
    }
  }

  return filter;
};

/*
=====================================================
Main Builder
=====================================================
*/

export const buildBookingFilter = (
  query = {},
) => {
  const filter = {};

  /*
  =====================================================
  Search
  =====================================================

  البحث العام.

  يدعم:
  - bookingNumber
  - notes
  - بيانات المعتمرين
  */

  if (query.search) {
    const searchRegex = {
      $regex: query.search,
      $options: "i",
    };

    filter.$or = [
      {
        bookingNumber: searchRegex,
      },

      {
        notes: searchRegex,
      },

      {
        "pilgrims.passportNumber":
          searchRegex,
      },

      {
        "pilgrims.firstNameAr":
          searchRegex,
      },

      {
        "pilgrims.lastNameAr":
          searchRegex,
      },

      {
        "pilgrims.firstNameEn":
          searchRegex,
      },

      {
        "pilgrims.lastNameEn":
          searchRegex,
      },
    ];
  }

  /*
  =====================================================
  Booking Status
  =====================================================
  */

  if (query.bookingStatus) {
    filter.bookingStatus =
      query.bookingStatus;
  }

  /*
  =====================================================
  Payment Status
  =====================================================
  */

  if (query.paymentStatus) {
    filter.paymentStatus =
      query.paymentStatus;
  }

  /*
  =====================================================
  User
  =====================================================
  */

  if (isValidObjectId(query.user)) {
    filter.user =
      query.user;
  }

  /*
  =====================================================
  Hotel
  =====================================================
  */

  if (isValidObjectId(query.hotel)) {
    filter.hotel =
      query.hotel;
  }

  /*
  =====================================================
  Room Type
  =====================================================
  */

  if (isValidObjectId(query.roomType)) {
    filter.roomType =
      query.roomType;
  }

  /*
  =====================================================
  Visa
  =====================================================
  */

  if (isValidObjectId(query.visa)) {
    filter.visa =
      query.visa;
  }

  /*
  =====================================================
  Trip
  =====================================================
  */

  if (isValidObjectId(query.trip)) {
    filter.trip =
      query.trip;
  }

  /*
  =====================================================
  Transport
  =====================================================
  */

  if (isValidObjectId(query.transport)) {
    filter.transport =
      query.transport;
  }

  /*
  =====================================================
  Created Date Range
  =====================================================

  createdFrom
  createdTo
  */

  Object.assign(
    filter,
    buildDateRangeFilter({
      field: "createdAt",
      from: query.createdFrom,
      to: query.createdTo,
    }),
  );

  /*
  =====================================================
  Travel Date Range
  =====================================================

  travelFrom
  travelTo
  */

  Object.assign(
    filter,
    buildDateRangeFilter({
      field: "travelDate",
      from: query.travelFrom,
      to: query.travelTo,
    }),
  );

  /*
  =====================================================
  Check-in Date Range
  =====================================================

  checkInFrom
  checkInTo
  */

  Object.assign(
    filter,
    buildDateRangeFilter({
      field: "checkIn",
      from: query.checkInFrom,
      to: query.checkInTo,
    }),
  );

  /*
  =====================================================
  Total Price Range
  =====================================================

  minTotal
  maxTotal
  */

  if (query.minTotal || query.maxTotal) {
    filter["pricing.totalPrice"] = {};

    if (query.minTotal) {
      filter["pricing.totalPrice"].$gte =
        Number(query.minTotal);
    }

    if (query.maxTotal) {
      filter["pricing.totalPrice"].$lte =
        Number(query.maxTotal);
    }
  }

  /*
  =====================================================
  Paid Amount Range
  =====================================================

  minPaid
  maxPaid
  */

  if (query.minPaid || query.maxPaid) {
    filter.paidAmount = {};

    if (query.minPaid) {
      filter.paidAmount.$gte =
        Number(query.minPaid);
    }

    if (query.maxPaid) {
      filter.paidAmount.$lte =
        Number(query.maxPaid);
    }
  }

  return filter;
};

/*
=====================================================
Allowed Booking Sort Fields
=====================================================

هذه القائمة ستستخدم لاحقاً في controller
مع buildSort أو sort يدوي.
*/

export const allowedBookingSortFields = [
  "createdAt",
  "updatedAt",
  "travelDate",
  "checkIn",
  "pricing.totalPrice",
  "paidAmount",
  "bookingNumber",
  "bookingStatus",
  "paymentStatus",
];