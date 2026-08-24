import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

import Notification from "../../models/notification-model.js";
import AppError from "../../utils/AppError.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_VALUES,
  NOTIFICATION_STATUS_VALUES,
  NOTIFICATION_TYPE_VALUES,
} from "../../constants/notifications/notification-constants.js";
import {
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  retryNotificationService,
} from "../../services/notifications/notification-service.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const filter = {
    user: req.user._id,
    channel: NOTIFICATION_CHANNELS.DATABASE,
    isDeleted: false,
  };
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === "true";
  const { skip, limit } = buildPagination(req.query);
  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate("booking", "bookingNumber bookingStatus paymentStatus"),
    Notification.countDocuments(filter),
  ]);
  res.status(200).json({ success: true, total, page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 10, data: notifications });
});

export const getMyUnreadCount = asyncHandler(async (req, res) => {
  const count = await getUnreadCount({ userId: req.user._id });
  res.status(200).json({ success: true, data: { count } });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsAsRead({ userId: req.user._id });
  res.status(200).json({ success: true, data: result });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const isArabic = isArabicRequest(req);
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
    channel: NOTIFICATION_CHANNELS.DATABASE,
    isDeleted: false,
  });
  if (!notification) {
    throw new AppError(isArabic ? "الإشعار غير موجود" : "Notification not found", 404, "notification");
  }
  await markNotificationAsRead({ notification });
  res.status(200).json({ success: true, message: isArabic ? "تم تعليم الإشعار كمقروء" : "Notification marked as read", data: notification });
});

export const getAllNotifications = asyncHandler(async (req, res) => {
  const filter = { isDeleted: false };
  if (req.query.user) {
    if (typeof req.query.user !== "string" || !mongoose.Types.ObjectId.isValid(req.query.user)) {
      throw new AppError("Invalid notification user", 400, "user");
    }
    filter.user = req.query.user;
  }
  if (req.query.booking) {
    if (typeof req.query.booking !== "string" || !mongoose.Types.ObjectId.isValid(req.query.booking)) {
      throw new AppError("Invalid notification booking", 400, "booking");
    }
    filter.booking = req.query.booking;
  }
  if (req.query.type) {
    if (!NOTIFICATION_TYPE_VALUES.includes(req.query.type)) throw new AppError("Invalid notification type", 400, "type");
    filter.type = req.query.type;
  }
  if (req.query.channel) {
    if (!NOTIFICATION_CHANNEL_VALUES.includes(req.query.channel)) throw new AppError("Invalid notification channel", 400, "channel");
    filter.channel = req.query.channel;
  }
  if (req.query.status) {
    if (!NOTIFICATION_STATUS_VALUES.includes(req.query.status)) throw new AppError("Invalid notification status", 400, "status");
    filter.status = req.query.status;
  }
  const { skip, limit } = buildPagination(req.query);
  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate("user", "firstName lastName username email")
      .populate("booking", "bookingNumber bookingStatus paymentStatus")
      .populate("createdBy", "firstName lastName username email"),
    Notification.countDocuments(filter),
  ]);
  res.status(200).json({ success: true, total, page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 10, data: notifications });
});

export const retryNotification = asyncHandler(async (req, res) => {
  try {
    const notification = await retryNotificationService({ notificationId: req.params.id, requestedBy: req.user._id });
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    if (error?.code === "NOTIFICATION_NOT_RETRYABLE") throw new AppError(error.message, 409, "notification");
    throw error;
  }
});
