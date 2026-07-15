// controllers/notifications/notification-controller.js

/*
=====================================================
Notification Controller
=====================================================

هذا الملف مسؤول عن APIs الخاصة بالإشعارات.

المسؤوليات:
-----------------------------------------------------
1- عرض إشعارات المستخدم الحالي.
2- تعليم إشعار كمقروء.
3- عرض كل الإشعارات للإدارة.
=====================================================
*/

import asyncHandler from "express-async-handler";

import Notification from "../../models/notification-model.js";

import AppError from "../../utils/AppError.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";

import {
  markNotificationAsRead,
} from "../../services/notifications/notification-service.js";

/*
=====================================================
GET MY NOTIFICATIONS
=====================================================
*/

export const getMyNotifications = asyncHandler(async (req, res) => {
  const filter = {
    user: req.user._id,
  };

  if (req.query.isRead !== undefined) {
    filter.isRead = req.query.isRead === "true";
  }

  const { skip, limit } = buildPagination(req.query);

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("booking", "bookingNumber bookingStatus paymentStatus"),

    Notification.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    data: notifications,
  });
});

/*
=====================================================
MARK NOTIFICATION AS READ
=====================================================
*/

export const markAsRead = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);

  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    throw new AppError(
      isArabic ? "الإشعار غير موجود" : "Notification not found",
      404,
      "notification",
    );
  }

  await markNotificationAsRead({
    notification,
  });

  res.status(200).json({
    success: true,
    message: isArabic ? "تم تعليم الإشعار كمقروء" : "Notification marked as read",
    data: notification,
  });
});

/*
=====================================================
GET ALL NOTIFICATIONS
=====================================================
*/

export const getAllNotifications = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.user) {
    filter.user = req.query.user;
  }

  if (req.query.booking) {
    filter.booking = req.query.booking;
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }

  if (req.query.channel) {
    filter.channel = req.query.channel;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const { skip, limit } = buildPagination(req.query);

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "firstName lastName username email")
      .populate("booking", "bookingNumber bookingStatus paymentStatus")
      .populate("createdBy", "firstName lastName username email"),

    Notification.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    data: notifications,
  });
});