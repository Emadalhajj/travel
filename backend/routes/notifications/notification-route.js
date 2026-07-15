// routes/notifications/notification-route.js

/*
=====================================================
Notification Routes
=====================================================

مسارات الإشعارات.

المستخدم:
-----------------------------------------------------
- عرض إشعاراته
- تعليم إشعار كمقروء

الإدارة:
-----------------------------------------------------
- عرض كل الإشعارات
=====================================================
*/


import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";

import {
  getMyNotifications,
  markAsRead,
  getAllNotifications,
} from "../../controllers/notifications/notification-controller.js";

const NotificationRoute = express.Router();

NotificationRoute.get(
  "/notifications/my",
  protect,
  getMyNotifications,
);

NotificationRoute.patch(
  "/notifications/:id/read",
  protect,
  markAsRead,
);

NotificationRoute.get(
  "/notifications",
  protect,
  authorize("admin", "superAdmin"),
  getAllNotifications,
);

export default NotificationRoute;