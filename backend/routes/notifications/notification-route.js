import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";
import {
  getAllNotifications,
  getMyNotifications,
  getMyUnreadCount,
  markAllAsRead,
  markAsRead,
  retryNotification,
} from "../../controllers/notifications/notification-controller.js";

const NotificationRoute = express.Router();

NotificationRoute.get("/notifications/my/unread-count", protect, getMyUnreadCount);
NotificationRoute.patch("/notifications/my/read-all", protect, markAllAsRead);
NotificationRoute.get("/notifications/my", protect, getMyNotifications);
NotificationRoute.patch("/notifications/:id/read", protect, markAsRead);
NotificationRoute.get(
  "/notifications",
  protect,
  authorize("admin", "superAdmin"),
  getAllNotifications,
);
NotificationRoute.post(
  "/notifications/:id/retry",
  protect,
  authorize("admin", "superAdmin"),
  retryNotification,
);

export default NotificationRoute;
