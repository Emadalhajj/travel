// routes/booking/booking-log-route.js

/*
=====================================================
Booking Log Routes
=====================================================

مسارات Timeline الخاصة بالحجز.

تستخدم في:
-----------------------------------------------------
- صفحة تفاصيل الحجز.
- لوحة الإدارة.
- تتبع تغييرات الحجز.
=====================================================
*/

import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";

import {
  getBookingLogs,
  getAllBookingLogs,
} from "../../controllers/booking/booking-log-controller.js";

const BookingLogRoute = express.Router();

BookingLogRoute.get(
  "/bookings/:bookingId/logs",
  protect,
  getBookingLogs,
);

BookingLogRoute.get(
  "/booking-logs",
  protect,
  authorize("admin", "superAdmin"),
  getAllBookingLogs,
);

export default BookingLogRoute;