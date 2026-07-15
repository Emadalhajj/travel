// controllers/booking/booking-log-controller.js

/*
=====================================================
Booking Log Controller
=====================================================

هذا الملف مسؤول عن عرض Timeline الخاص بالحجز.

المسارات المقترحة:
-----------------------------------------------------
GET /api/bookings/:bookingId/logs
GET /api/booking-logs
=====================================================
*/

import asyncHandler from "express-async-handler";

import Booking from "../../models/booking/booking-model.js";
import BookingLog from "../../models/bookingLog-model.js";

import AppError from "../../utils/AppError.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";

/*
=====================================================
GET BOOKING LOGS
=====================================================
*/

export const getBookingLogs = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    throw new AppError(
      isArabic ? "الحجز غير موجود" : "Booking not found",
      404,
      "booking",
    );
  }

  const logs = await BookingLog.find({
    booking: booking._id,
  })
    .sort({ createdAt: -1 })
    .populate("performedBy", "firstName lastName username email role");

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs,
  });
});

/*
=====================================================
GET ALL BOOKING LOGS
=====================================================
*/

export const getAllBookingLogs = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.booking) {
    filter.booking = req.query.booking;
  }

  if (req.query.action) {
    filter.action = req.query.action;
  }

  if (req.query.performedBy) {
    filter.performedBy = req.query.performedBy;
  }

  const { skip, limit } = buildPagination(req.query);

  const [logs, total] = await Promise.all([
    BookingLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("booking", "bookingNumber bookingStatus paymentStatus")
      .populate("performedBy", "firstName lastName username email role"),

    BookingLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    data: logs,
  });
});