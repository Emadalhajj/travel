// services/audit/security-event-service.js

/*
=====================================================
Security Event Service
=====================================================

هذا الملف مسؤول عن تسجيل وقراءة الأحداث الأمنية.

يستخدم عند:
-----------------------------------------------------
- فشل تسجيل الدخول
- محاولة دخول بدون صلاحية
- توكن غير صالح
- نشاط مشبوه
=====================================================
*/
import SecurityEvent from "../../models/audit/ecurity-event-model.js";
import { getRequestInfo } from "../../utils/requestInfo.js";

/*
=====================================================
createSecurityEvent
=====================================================

تسجيل حدث أمني.
=====================================================
*/

export const createSecurityEvent = async ({
  req,
  type,
  message,
  metadata = {},
}) => {
  const requestInfo = req ? getRequestInfo(req) : {};

  const event = await SecurityEvent.create({
    type,
    message,
    user: req?.user?._id || null,
    metadata,
    ...requestInfo,
  });

  return event;
};

/*
=====================================================
getSecurityEvents
=====================================================

جلب الأحداث الأمنية للإدارة.
=====================================================
*/

export const getSecurityEvents = async ({
  page = 1,
  limit = 20,
  type,
  user,
}) => {
  const skip = (page - 1) * limit;

  const filter = {};

  if (type) {
    filter.type = type;
  }

  if (user) {
    filter.user = user;
  }

  const [items, total] = await Promise.all([
    SecurityEvent.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    SecurityEvent.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};