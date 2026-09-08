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
import mongoose from "mongoose";
import SecurityEvent from "../../models/audit/security-event-model.js";
import { getRequestInfo } from "../../utils/requestInfo.js";
import AppError from "../../utils/AppError.js";
import { SECURITY_EVENT_TYPES_LIST } from "../../constants/audit/security-event-types.js";

const MAX_PAGE_LIMIT = 100;
const USER_POPULATE_FIELDS = "firstName lastName username email role";

const parseDate = (value, field, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError("INVALID_FILTER_FIELD", 400, field);
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) date.setUTCHours(23, 59, 59, 999);
  return date;
};

export const normalizeSecurityEventPagination = ({ page = 1, limit = 20 } = {}) => ({
  page: Math.max(1, Math.floor(Number(page) || 1)),
  limit: Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(Number(limit) || 20))),
});

export const buildSecurityEventFilter = ({ type, user, dateFrom, dateTo } = {}) => {
  const filter = {};
  if (type) {
    if (!SECURITY_EVENT_TYPES_LIST.includes(type)) throw new AppError("INVALID_SECURITY_EVENT_TYPE", 400, "type");
    filter.type = type;
  }
  if (user) {
    if (!mongoose.Types.ObjectId.isValid(user)) throw new AppError("INVALID_USER_ID", 400, "user");
    filter.user = user;
  }
  const from = parseDate(dateFrom, "dateFrom");
  const to = parseDate(dateTo, "dateTo", true);
  if (from && to && from > to) throw new AppError("DATE_FROM_AFTER_DATE_TO", 400, "dateFrom");
  if (from || to) filter.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  return filter;
};

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
  buildSecurityEventFilter({ type });

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
  dateFrom,
  dateTo,
}) => {
  const pagination = normalizeSecurityEventPagination({ page, limit });
  const skip = (pagination.page - 1) * pagination.limit;
  const filter = buildSecurityEventFilter({ type, user, dateFrom, dateTo });

  const [items, total] = await Promise.all([
    SecurityEvent.find(filter)
      .populate("user", USER_POPULATE_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pagination.limit),

    SecurityEvent.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    pages: Math.ceil(total / pagination.limit),
  };
};
