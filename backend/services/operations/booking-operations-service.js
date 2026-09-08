import mongoose from "mongoose";

import Booking from "../../models/booking/booking-model.js";
import BookingLog from "../../models/bookingLog-model.js";
import PaymentTransaction from "../../models/payments/paymentTransaction-model.js";
import InventoryHold from "../../models/inventory-hold-model.js";
import AuditLog from "../../models/audit/audit-log-model.js";
import AppError from "../../utils/AppError.js";
import { BOOKING_STATUS, BOOKING_STATUS_LIST } from "../../constants/booking/booking-status.js";
import { PAYMENT_STATUS, PAYMENT_STATUS_LIST } from "../../constants/booking/payment-status.js";
import { PAYMENT_METHOD_CODE_VALUES } from "../../constants/payments/payment-method-codes.js";
import {
  PAYMENT_TRANSACTION_STATUSES,
  SETTLED_PAYMENT_TRANSACTION_STATUSES,
} from "../../constants/payments/payment-transaction-statuses.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";
import { sanitizeSensitiveAuditData } from "../audit/audit-log-service.js";

const MAX_PAGE_LIMIT = 100;
const USER_FIELDS = "firstName lastName username email role";
export const BOOKING_360_SELECT = [
  "bookingNumber",
  "bookingType",
  "bookingStatus",
  "paymentStatus",
  "paymentMethod",
  "paidAmount",
  "remainingAmount",
  "customer",
  "pilgrims",
  "hosts",
  "pricing",
  "program",
  "bookingItems",
  "createdBy",
  "updatedBy",
  "createdAt",
  "updatedAt",
].join(" ");
export const BOOKING_360_AUDIT_SELECT = [
  "action",
  "entity",
  "entityId",
  "before",
  "after",
  "metadata",
  "user",
  "method",
  "url",
  "createdAt",
].join(" ");
export const BOOKING_360_HOLD_SELECT = [
  "status",
  "isActive",
  "expiresAt",
  "heldAt",
  "committedAt",
  "releasedAt",
  "releaseReason",
  "failureReason",
  "inventoryReservations",
  "programReservation",
].join(" ");
const ATTENTION_PAYMENT_STATUSES = new Set([
  PAYMENT_TRANSACTION_STATUSES.PENDING_APPROVAL,
  PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
  PAYMENT_TRANSACTION_STATUSES.PENDING_REVIEW,
  PAYMENT_TRANSACTION_STATUSES.FAILED,
  PAYMENT_TRANSACTION_STATUSES.REJECTED,
  PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
]);
const SETTLED_STATUSES = new Set(SETTLED_PAYMENT_TRANSACTION_STATUSES);

const asPlain = (value) =>
  typeof value?.toObject === "function" ? value.toObject() : value;

const id = (value) => {
  if (value?._bsontype === "ObjectId") return value;
  if (value && typeof value === "object") return value._id || null;
  return value || null;
};
const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDate = (value, field, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError("INVALID_FILTER_FIELD", 400, field);
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
};

const normalizePaymentMethod = (paymentMethod) => {
  const normalizedMethod = String(paymentMethod || "").trim().toUpperCase();
  if (normalizedMethod && !PAYMENT_METHOD_CODE_VALUES.includes(normalizedMethod)) {
    throw new AppError("INVALID_PAYMENT_METHOD", 400, "paymentMethod");
  }
  return normalizedMethod;
};

export const normalizeOperationsPagination = ({ page = 1, limit = 20 } = {}) => ({
  page: Math.max(1, Math.floor(Number(page) || 1)),
  limit: Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(Number(limit) || 20))),
});

export const buildOperationsBookingFilter = ({
  bookingStatus,
  paymentStatus,
  paymentMethod,
  paymentMethodBookingIds = [],
  dateFrom,
  dateTo,
  search,
} = {}) => {
  const filter = { isDeleted: false };
  if (bookingStatus) {
    if (!BOOKING_STATUS_LIST.includes(bookingStatus)) {
      throw new AppError("INVALID_BOOKING_STATUS", 400, "bookingStatus");
    }
    filter.bookingStatus = bookingStatus;
  }
  if (paymentStatus) {
    if (!PAYMENT_STATUS_LIST.includes(paymentStatus)) {
      throw new AppError("INVALID_PAYMENT_STATUS", 400, "paymentStatus");
    }
    filter.paymentStatus = paymentStatus;
  }
  if (paymentMethod) {
    const normalizedMethod = normalizePaymentMethod(paymentMethod);
    filter.$and = [{
      $or: [
        { paymentMethod: { $regex: `^${escapeRegExp(normalizedMethod)}$`, $options: "i" } },
        { _id: { $in: paymentMethodBookingIds } },
      ],
    }];
  }
  const from = parseDate(dateFrom, "dateFrom");
  const to = parseDate(dateTo, "dateTo", true);
  if (from && to && from > to) {
    throw new AppError("DATE_FROM_AFTER_DATE_TO", 400, "dateFrom");
  }
  if (from || to) {
    filter.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }
  const term = String(search || "").trim();
  if (term) {
    const searchFilter = {
      $or: ["bookingNumber", "customer.name", "customer.email", "customer.phone"].map((field) => ({
        [field]: { $regex: escapeRegExp(term), $options: "i" },
      })),
    };
    filter.$and = [...(filter.$and || []), searchFilter];
  }
  return filter;
};

export const deriveAttentionRequired = ({ booking = {}, payments = [] } = {}) => {
  const statuses = payments.map((payment) => String(payment?.status || "").toLowerCase());
  const hasSettledPayment = statuses.some((status) => SETTLED_STATUSES.has(status));
  const needsPaymentReview = statuses.some((status) => ATTENTION_PAYMENT_STATUSES.has(status));
  const paymentInconsistency =
    (booking.paymentStatus === PAYMENT_STATUS.PAID && !hasSettledPayment) ||
    (hasSettledPayment && booking.paymentStatus !== PAYMENT_STATUS.PAID) ||
    (hasSettledPayment && booking.bookingStatus === BOOKING_STATUS.CANCELLED);
  return booking.paymentStatus === PAYMENT_STATUS.FAILED || needsPaymentReview || paymentInconsistency;
};

export const sortChronologically = (items = []) => [...items].sort((left, right) =>
  new Date(left?.createdAt || 0) - new Date(right?.createdAt || 0));

const serializeUser = (user) => user ? {
  id: id(user),
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  username: user.username || "",
  email: user.email || "",
  role: user.role || "",
} : null;

export const serializeOperationsPayment = (value) => {
  const payment = asPlain(value) || {};
  return {
    id: id(payment),
    methodCode: payment.methodCode || "",
    methodNameAr: payment.methodNameAr || "",
    methodNameEn: payment.methodNameEn || "",
    providerCode: payment.providerCode || "",
    amount: payment.amount || 0,
    currency: payment.currency || "",
    status: payment.status || "",
    paymentReference: payment.paymentReference || "",
    providerReference: payment.providerReference || "",
    transferReference: payment.transferReference || "",
    failureReason: payment.failureReason || "",
    rejectionReason: payment.rejectionReason || "",
    verifiedBy: serializeUser(payment.verifiedBy),
    verifiedAt: payment.verifiedAt || null,
    createdBy: serializeUser(payment.createdBy),
    updatedBy: serializeUser(payment.updatedBy),
    statusHistory: sortChronologically(payment.events || []).map((event) => ({
      id: id(event),
      fromStatus: event.fromStatus || null,
      toStatus: event.toStatus || null,
      source: event.source || "",
      eventCode: event.eventCode || "",
      message: event.message || "",
      providerReference: event.providerReference || "",
      performedBy: serializeUser(event.createdBy),
      createdAt: event.createdAt || null,
    })),
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
};

const serializeBooking = (value) => {
  const booking = asPlain(value) || {};
  return {
    id: id(booking),
    bookingNumber: booking.bookingNumber || "",
    bookingType: booking.bookingType || "",
    bookingStatus: booking.bookingStatus || "",
    paymentStatus: booking.paymentStatus || "",
    paymentMethod: booking.paymentMethod || "",
    paidAmount: booking.paidAmount || 0,
    remainingAmount: booking.remainingAmount || 0,
    customer: booking.customer || {},
    pilgrims: booking.pilgrims || [],
    hosts: booking.hosts || [],
    pricing: booking.pricing || {},
    program: booking.program || {},
    bookingItems: booking.bookingItems || {},
    createdBy: serializeUser(booking.createdBy),
    updatedBy: serializeUser(booking.updatedBy),
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
};

const serializeBookingLog = (value) => {
  const log = asPlain(value) || {};
  return sanitizeSensitiveAuditData({
    id: id(log),
    action: log.action || "",
    messageAr: log.messageAr || "",
    messageEn: log.messageEn || "",
    oldValue: log.oldValue ?? null,
    newValue: log.newValue ?? null,
    performedBy: serializeUser(log.performedBy),
    role: log.role || "",
    createdAt: log.createdAt,
  });
};

const serializeAuditLog = (value) => {
  const log = asPlain(value) || {};
  return sanitizeSensitiveAuditData({
    id: id(log),
    action: log.action || "",
    entity: log.entity || "",
    entityId: log.entityId || null,
    before: log.before ?? null,
    after: log.after ?? null,
    metadata: log.metadata || {},
    performedBy: serializeUser(log.user),
    method: log.method || "",
    url: log.url || "",
    createdAt: log.createdAt,
  });
};

const serializeInventory = (value) => {
  const hold = asPlain(Array.isArray(value) ? value[0] : value);
  if (!hold) return { hold: null, reservations: [], programReservation: null };
  return {
    hold: {
      id: id(hold),
      status: hold.status,
      isActive: Boolean(hold.isActive),
      expiresAt: hold.expiresAt || null,
      heldAt: hold.heldAt || null,
      committedAt: hold.committedAt || null,
      releasedAt: hold.releasedAt || null,
      releaseReason: hold.releaseReason || "",
      failureReason: hold.failureReason || "",
    },
    reservations: (hold.inventoryReservations || []).map((reservation) => ({
      id: id(reservation),
      inventoryType: reservation.inventoryType,
      itemId: reservation.itemId,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      quantity: reservation.quantity,
      releasedAt: reservation.releasedAt || null,
    })),
    programReservation: hold.programReservation || null,
  };
};

export const bookingOperationsRepository = {
  getBooking: (bookingId) => Booking.findOne({ _id: bookingId, isDeleted: false })
    .select(BOOKING_360_SELECT)
    .populate("createdBy", USER_FIELDS)
    .populate("updatedBy", USER_FIELDS)
    .lean(),
  getPayments: async (bookingId) => {
    const payments = await PaymentTransaction.find({
      booking: bookingId,
      isDeleted: false,
    })
      .select("booking methodCode methodNameAr methodNameEn providerCode amount currency status paymentReference providerReference transferReference failureReason rejectionReason verifiedBy verifiedAt createdBy updatedBy createdAt updatedAt +events")
      .populate("verifiedBy", USER_FIELDS)
      .populate("createdBy", USER_FIELDS)
      .populate("updatedBy", USER_FIELDS)
      .sort({ createdAt: 1 })
      .lean();

    return PaymentTransaction.populate(payments, {
      path: "events.createdBy",
      select: USER_FIELDS,
    });
  },
  getTimeline: (bookingId) => BookingLog.find({ booking: bookingId })
    .populate("performedBy", USER_FIELDS)
    .sort({ createdAt: 1 })
    .lean(),
  getAudit: ({ bookingId, paymentIds }) => AuditLog.find({
    $or: [
      { entity: AUDIT_ENTITIES.BOOKING, entityId: bookingId },
      { entity: AUDIT_ENTITIES.PAYMENT_TRANSACTION, entityId: { $in: paymentIds } },
    ],
  })
    .select(BOOKING_360_AUDIT_SELECT)
    .populate("user", USER_FIELDS)
    .sort({ createdAt: 1 })
    .lean(),
  getLatestInventoryHold: (paymentIds) => paymentIds.length
    ? InventoryHold.findOne({ paymentTransaction: { $in: paymentIds } })
      .sort({ createdAt: -1 })
      .select(BOOKING_360_HOLD_SELECT)
      .lean()
    : null,
  findBookingIdsByPaymentMethod: (paymentMethod) => PaymentTransaction.distinct("booking", {
    methodCode: String(paymentMethod).trim().toUpperCase(),
    booking: { $ne: null },
    isDeleted: false,
  }),
  listBookings: ({ filter, skip, limit }) => Booking.find(filter)
    .select("bookingNumber bookingStatus paymentStatus paymentMethod customer pricing program totalPilgrims createdAt updatedAt")
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean(),
  countBookings: (filter) => Booking.countDocuments(filter),
  getPaymentSummaries: (bookingIds) => PaymentTransaction.find({
    booking: { $in: bookingIds }, isDeleted: false,
  }).select("booking status methodCode amount currency createdAt").lean(),
};

export const createBookingOperationsServiceLayer = (repository = {}) => {
  const repo = { ...bookingOperationsRepository, ...repository };

  const getBookingOperationsDetailsService = async ({ bookingId }) => {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new AppError("INVALID_BOOKING_ID", 400, "bookingId");
    }
    const booking = await repo.getBooking(bookingId);
    if (!booking) throw new AppError("BOOKING_NOT_FOUND", 404, "bookingId");
    const [rawPayments, rawTimeline] = await Promise.all([
      repo.getPayments(bookingId),
      repo.getTimeline(bookingId),
    ]);
    const paymentIds = rawPayments.map((payment) => id(payment)).filter(Boolean);
    const [rawAudit, latestHold] = await Promise.all([
      repo.getAudit({ bookingId, paymentIds }),
      repo.getLatestInventoryHold(paymentIds),
    ]);
    const payments = rawPayments.map(serializeOperationsPayment);
    return {
      booking: serializeBooking(booking),
      payments,
      inventory: serializeInventory(latestHold),
      timeline: sortChronologically(rawTimeline.map(serializeBookingLog)),
      audit: sortChronologically(rawAudit.map(serializeAuditLog)),
      attentionRequired: deriveAttentionRequired({ booking, payments }),
    };
  };

  const listBookingOperationsService = async (query = {}) => {
    const pagination = normalizeOperationsPagination(query);
    const normalizedPaymentMethod = normalizePaymentMethod(query.paymentMethod);
    const paymentMethodBookingIds = query.paymentMethod
      ? await repo.findBookingIdsByPaymentMethod(normalizedPaymentMethod)
      : [];
    const filter = buildOperationsBookingFilter({ ...query, paymentMethodBookingIds });
    const skip = (pagination.page - 1) * pagination.limit;
    const [bookings, total] = await Promise.all([
      repo.listBookings({ filter, skip, limit: pagination.limit }),
      repo.countBookings(filter),
    ]);
    const bookingIds = bookings.map((booking) => id(booking)).filter(Boolean);
    const paymentRows = bookingIds.length ? await repo.getPaymentSummaries(bookingIds) : [];
    const paymentsByBooking = new Map();
    for (const payment of paymentRows) {
      const key = String(id(payment.booking));
      paymentsByBooking.set(key, [...(paymentsByBooking.get(key) || []), payment]);
    }
    const items = bookings.map((booking) => {
      const payments = paymentsByBooking.get(String(id(booking))) || [];
      return {
        ...serializeBooking(booking),
        latestPayment: payments.length
          ? serializeOperationsPayment(sortChronologically(payments).at(-1))
          : null,
        attentionRequired: deriveAttentionRequired({ booking, payments }),
      };
    });
    return {
      items,
      pagination: {
        ...pagination,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNextPage: pagination.page * pagination.limit < total,
        hasPreviousPage: pagination.page > 1,
      },
    };
  };

  return { getBookingOperationsDetailsService, listBookingOperationsService };
};

const operationsService = createBookingOperationsServiceLayer();
export const getBookingOperationsDetailsService = operationsService.getBookingOperationsDetailsService;
export const listBookingOperationsService = operationsService.listBookingOperationsService;
