import mongoose from "mongoose";

import Booking from "../../models/booking/booking-model.js";
import PaymentTransaction from "../../models/payments/paymentTransaction-model.js";
import AppError from "../../utils/AppError.js";
import { BOOKING_STATUS, BOOKING_STATUS_LIST } from "../../constants/booking/booking-status.js";
import { PAYMENT_STATUS_LIST } from "../../constants/booking/payment-status.js";
import { PAYMENT_METHOD_CODES, PAYMENT_METHOD_CODE_VALUES } from "../../constants/payments/payment-method-codes.js";
import {
  LEGACY_PAYMENT_TRANSACTION_STATUSES,
  PAYMENT_TRANSACTION_STATUSES,
  SETTLED_PAYMENT_TRANSACTION_STATUSES,
} from "../../constants/payments/payment-transaction-statuses.js";
import { deriveAttentionRequired } from "../operations/booking-operations-service.js";

const SUCCESSFUL_TRANSACTION_STATUSES = new Set(SETTLED_PAYMENT_TRANSACTION_STATUSES);
const FAILED_TRANSACTION_STATUSES = new Set([
  PAYMENT_TRANSACTION_STATUSES.FAILED,
  PAYMENT_TRANSACTION_STATUSES.REJECTED,
  PAYMENT_TRANSACTION_STATUSES.CANCELED,
  PAYMENT_TRANSACTION_STATUSES.EXPIRED,
]);
const PENDING_TRANSACTION_STATUSES = new Set([
  PAYMENT_TRANSACTION_STATUSES.INITIATED,
  PAYMENT_TRANSACTION_STATUSES.PENDING,
  PAYMENT_TRANSACTION_STATUSES.PENDING_PROOF,
  PAYMENT_TRANSACTION_STATUSES.PENDING_APPROVAL,
  PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
  PAYMENT_TRANSACTION_STATUSES.PENDING_REVIEW,
  PAYMENT_TRANSACTION_STATUSES.PROCESSING,
  PAYMENT_TRANSACTION_STATUSES.AUTHORIZED,
]);
const BANK_REVIEW_STATUSES = new Set([
  PAYMENT_TRANSACTION_STATUSES.PENDING_APPROVAL,
  PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
  PAYMENT_TRANSACTION_STATUSES.PENDING_REVIEW,
]);

const asNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = (value) => Number(asNumber(value).toFixed(2));
const id = (value) => {
  if (value?._bsontype === "ObjectId") return value;
  return value && typeof value === "object" ? value._id || null : value || null;
};

const parseDate = (value, field, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(`Invalid ${field}`, 400, field);
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
};

export const normalizeReportFilters = ({
  dateFrom,
  dateTo,
  bookingStatus,
  paymentStatus,
  paymentMethod,
  programId,
} = {}) => {
  if (bookingStatus && !BOOKING_STATUS_LIST.includes(bookingStatus)) {
    throw new AppError("Invalid bookingStatus", 400, "bookingStatus");
  }
  if (paymentStatus && !PAYMENT_STATUS_LIST.includes(paymentStatus)) {
    throw new AppError("Invalid paymentStatus", 400, "paymentStatus");
  }
  const normalizedMethod = String(paymentMethod || "").trim().toUpperCase();
  if (normalizedMethod && !PAYMENT_METHOD_CODE_VALUES.includes(normalizedMethod)) {
    throw new AppError("Invalid paymentMethod", 400, "paymentMethod");
  }
  if (programId && !mongoose.Types.ObjectId.isValid(programId)) {
    throw new AppError("Invalid programId", 400, "programId");
  }
  const from = parseDate(dateFrom, "dateFrom");
  const to = parseDate(dateTo, "dateTo", true);
  if (from && to && from > to) {
    throw new AppError("dateFrom must be before dateTo", 400, "dateFrom");
  }
  return {
    dateFrom: from,
    dateTo: to,
    bookingStatus: bookingStatus || "",
    paymentStatus: paymentStatus || "",
    paymentMethod: normalizedMethod,
    programId: programId || "",
  };
};

export const buildReportBookingFilter = (filters, paymentMethodBookingIds = []) => {
  const filter = { isDeleted: false };
  if (filters.bookingStatus) filter.bookingStatus = filters.bookingStatus;
  if (filters.paymentStatus) filter.paymentStatus = filters.paymentStatus;
  if (filters.programId) filter["program.programId"] = filters.programId;
  if (filters.dateFrom || filters.dateTo) {
    filter.createdAt = {
      ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { $lte: filters.dateTo } : {}),
    };
  }
  if (filters.paymentMethod) {
    filter.$or = [
      { paymentMethod: { $regex: `^${filters.paymentMethod}$`, $options: "i" } },
      { _id: { $in: paymentMethodBookingIds } },
    ];
  }
  return filter;
};

export const buildReportPaymentFilter = (filters, dimensionBookingIds = null) => {
  const filter = { isDeleted: false };
  if (filters.paymentMethod) filter.methodCode = filters.paymentMethod;
  if (filters.dateFrom || filters.dateTo) {
    filter.createdAt = {
      ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { $lte: filters.dateTo } : {}),
    };
  }
  if (dimensionBookingIds) filter.booking = { $in: dimensionBookingIds };
  return filter;
};

const countBy = (values, keys) => {
  const result = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const value of values) {
    const key = String(value || "").toLowerCase();
    if (Object.hasOwn(result, key)) result[key] += 1;
  }
  return result;
};

export const buildBookingReport = ({ bookings = [], paymentStatusesByBooking = new Map() }) => {
  const byStatus = countBy(bookings.map((booking) => booking.bookingStatus), BOOKING_STATUS_LIST);
  const byPaymentStatus = countBy(bookings.map((booking) => booking.paymentStatus), PAYMENT_STATUS_LIST);
  const travelersTotal = bookings.reduce(
    (sum, booking) => sum + asNumber(booking.totalPilgrims ?? booking.pilgrims?.length),
    0,
  );
  const attentionRequired = bookings.reduce((count, booking) => {
    const payments = paymentStatusesByBooking.get(String(id(booking))) || [];
    return count + Number(deriveAttentionRequired({ booking, payments }));
  }, 0);
  return {
    total: bookings.length,
    byStatus,
    byPaymentStatus,
    confirmed: byStatus[BOOKING_STATUS.CONFIRMED] || 0,
    pending: byStatus[BOOKING_STATUS.PENDING] || 0,
    cancelled: byStatus[BOOKING_STATUS.CANCELLED] || 0,
    travelers: { total: travelersTotal },
    attentionRequired,
  };
};

const groupPayments = (payments, field, emptyKey) => {
  const groups = new Map();
  for (const payment of payments) {
    const key = String(payment[field] || emptyKey);
    const current = groups.get(key) || { code: key, transactionsCount: 0, totalAmount: 0, settledAmount: 0 };
    current.transactionsCount += 1;
    current.totalAmount += asNumber(payment.amount);
    if (SUCCESSFUL_TRANSACTION_STATUSES.has(String(payment.status || "").toLowerCase())) {
      current.settledAmount += asNumber(payment.amount);
    }
    groups.set(key, current);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    totalAmount: money(group.totalAmount),
    settledAmount: money(group.settledAmount),
  })).sort((left, right) => right.settledAmount - left.settledAmount);
};

export const buildPaymentReport = ({ bookings = [], payments = [] }) => {
  const statuses = payments.map((payment) => String(payment.status || "").toLowerCase());
  const successfulTransactions = statuses.filter((status) => SUCCESSFUL_TRANSACTION_STATUSES.has(status)).length;
  const failedTransactions = statuses.filter((status) => FAILED_TRANSACTION_STATUSES.has(status)).length;
  const pendingTransactions = statuses.filter((status) => PENDING_TRANSACTION_STATUSES.has(status)).length;
  const bankTransfers = payments.filter((payment) => payment.methodCode === PAYMENT_METHOD_CODES.BANK_TRANSFER);
  return {
    totalBookingValue: money(bookings.reduce((sum, booking) => sum + asNumber(booking.pricing?.totalPrice), 0)),
    paidAmount: money(bookings.reduce((sum, booking) => sum + asNumber(booking.paidAmount), 0)),
    remainingAmount: money(bookings.reduce((sum, booking) => sum + asNumber(booking.remainingAmount), 0)),
    transactions: {
      total: payments.length,
      successful: successfulTransactions,
      failed: failedTransactions,
      pending: pendingTransactions,
      refunded: statuses.filter((status) => [
        PAYMENT_TRANSACTION_STATUSES.REFUNDED,
        PAYMENT_TRANSACTION_STATUSES.PARTIALLY_REFUNDED,
      ].includes(status)).length,
      legacyPaid: statuses.filter((status) => status === LEGACY_PAYMENT_TRANSACTION_STATUSES.PAID).length,
    },
    byMethod: groupPayments(payments, "methodCode", "UNSPECIFIED"),
    byProvider: groupPayments(payments, "providerCode", "NONE"),
    bankTransfers: {
      pendingVerification: bankTransfers.filter(
        (payment) => payment.status === PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
      ).length,
      pendingReview: bankTransfers.filter((payment) => BANK_REVIEW_STATUSES.has(payment.status)).length,
    },
    paidPendingBooking: statuses.filter(
      (status) => status === PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
    ).length,
  };
};

export const buildProgramReport = ({ bookings = [] }) => {
  const groups = new Map();
  for (const booking of bookings) {
    const programId = id(booking.program?.programId);
    if (!programId) continue;
    const key = String(programId);
    const current = groups.get(key) || {
      programId,
      programNameAr: booking.program?.nameAr || "",
      programNameEn: booking.program?.nameEn || "",
      bookingsCount: 0,
      travelersCount: 0,
      grossBookingValue: 0,
      paidAmount: 0,
    };
    current.bookingsCount += 1;
    current.travelersCount += asNumber(booking.totalPilgrims ?? booking.pilgrims?.length);
    current.grossBookingValue += asNumber(booking.pricing?.totalPrice);
    current.paidAmount += asNumber(booking.paidAmount);
    groups.set(key, current);
  }
  return [...groups.values()].map((program) => ({
    ...program,
    grossBookingValue: money(program.grossBookingValue),
    paidAmount: money(program.paidAmount),
  })).sort((left, right) => right.bookingsCount - left.bookingsCount);
};

const defaultRepository = {
  findBookingIdsByPaymentMethod: (methodCode) => PaymentTransaction.distinct("booking", {
    methodCode,
    booking: { $ne: null },
    isDeleted: false,
  }),
  getBookings: (filter) => Booking.find(filter)
    .select("bookingStatus paymentStatus paymentMethod pricing paidAmount remainingAmount totalPilgrims program createdAt")
    .lean(),
  getPayments: (filter) => PaymentTransaction.find(filter)
    .select("booking methodCode providerCode amount currency status createdAt")
    .lean(),
  getPaymentStatusesForBookings: (bookingIds) => bookingIds.length
    ? PaymentTransaction.find({ booking: { $in: bookingIds }, isDeleted: false })
      .select("booking status")
      .lean()
    : [],
};

export const createReportServiceLayer = (repository = {}) => {
  const repo = { ...defaultRepository, ...repository };

  const loadReportContext = async (
    rawFilters = {},
    { includePayments = true, includeAttention = true } = {},
  ) => {
    const filters = normalizeReportFilters(rawFilters);
    const paymentMethodBookingIds = filters.paymentMethod
      ? await repo.findBookingIdsByPaymentMethod(filters.paymentMethod)
      : [];
    const bookingFilter = buildReportBookingFilter(filters, paymentMethodBookingIds);
    const bookings = await repo.getBookings(bookingFilter);
    const bookingIds = bookings.map((booking) => id(booking)).filter(Boolean);
    const hasBookingDimensionFilter = Boolean(
      filters.bookingStatus || filters.paymentStatus || filters.programId,
    );
    const paymentFilter = includePayments
      ? buildReportPaymentFilter(filters, hasBookingDimensionFilter ? bookingIds : null)
      : null;
    const [payments, attentionPayments] = await Promise.all([
      includePayments ? repo.getPayments(paymentFilter) : [],
      includeAttention ? repo.getPaymentStatusesForBookings(bookingIds) : [],
    ]);
    const paymentStatusesByBooking = new Map();
    for (const payment of attentionPayments) {
      const key = String(id(payment.booking));
      paymentStatusesByBooking.set(key, [
        ...(paymentStatusesByBooking.get(key) || []),
        { status: payment.status },
      ]);
    }
    return { filters, bookings, payments, paymentStatusesByBooking };
  };

  const getBookingsReportService = async (filters) => {
    const context = await loadReportContext(filters, {
      includePayments: false,
      includeAttention: true,
    });
    return buildBookingReport(context);
  };

  const getPaymentsReportService = async (filters) => {
    const context = await loadReportContext(filters, {
      includePayments: true,
      includeAttention: false,
    });
    return buildPaymentReport(context);
  };

  const getProgramsReportService = async (filters) => {
    const context = await loadReportContext(filters, {
      includePayments: false,
      includeAttention: false,
    });
    return buildProgramReport(context);
  };

  const getReportsOverviewService = async (filters) => {
    const context = await loadReportContext(filters);
    const bookings = buildBookingReport(context);
    const payments = buildPaymentReport(context);
    return {
      bookings: {
        total: bookings.total,
        confirmed: bookings.confirmed,
        pending: bookings.pending,
        cancelled: bookings.cancelled,
        attentionRequired: bookings.attentionRequired,
        byStatus: bookings.byStatus,
        byPaymentStatus: bookings.byPaymentStatus,
      },
      travelers: bookings.travelers,
      payments: {
        totalAmount: payments.totalBookingValue,
        paidAmount: payments.paidAmount,
        remainingAmount: payments.remainingAmount,
        successfulTransactions: payments.transactions.successful,
        failedTransactions: payments.transactions.failed,
        pendingTransactions: payments.transactions.pending,
        paidPendingBooking: payments.paidPendingBooking,
      },
      bankTransfers: payments.bankTransfers,
    };
  };

  return {
    getReportsOverviewService,
    getBookingsReportService,
    getPaymentsReportService,
    getProgramsReportService,
  };
};

const reportService = createReportServiceLayer();
export const getReportsOverviewService = reportService.getReportsOverviewService;
export const getBookingsReportService = reportService.getBookingsReportService;
export const getPaymentsReportService = reportService.getPaymentsReportService;
export const getProgramsReportService = reportService.getProgramsReportService;
