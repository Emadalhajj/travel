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
  if (Number.isNaN(date.getTime())) throw new AppError("INVALID_FILTER_FIELD", 400, field);
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
    throw new AppError("INVALID_BOOKING_STATUS", 400, "bookingStatus");
  }
  if (paymentStatus && !PAYMENT_STATUS_LIST.includes(paymentStatus)) {
    throw new AppError("INVALID_PAYMENT_STATUS", 400, "paymentStatus");
  }
  const normalizedMethod = String(paymentMethod || "").trim().toUpperCase();
  if (normalizedMethod && !PAYMENT_METHOD_CODE_VALUES.includes(normalizedMethod)) {
    throw new AppError("INVALID_PAYMENT_METHOD", 400, "paymentMethod");
  }
  if (programId && !mongoose.Types.ObjectId.isValid(programId)) {
    throw new AppError("INVALID_PROGRAM_ID", 400, "programId");
  }
  const from = parseDate(dateFrom, "dateFrom");
  const to = parseDate(dateTo, "dateTo", true);
  if (from && to && from > to) {
    throw new AppError("DATE_FROM_AFTER_DATE_TO", 400, "dateFrom");
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

const statusCountExpression = (statuses) => ({
  $sum: { $cond: [{ $in: ["$status", [...statuses]] }, 1, 0] },
});

export const buildBookingReportAggregation = (filter, { includeAttention = false } = {}) => {
  const pipeline = [{ $match: filter }];
  if (includeAttention) {
    pipeline.push({
      $lookup: {
        from: PaymentTransaction.collection.name,
        let: { bookingId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$booking", "$$bookingId"] }, isDeleted: false } },
          { $project: { _id: 0, status: 1 } },
        ],
        as: "attentionPayments",
      },
    });
  }
  pipeline.push({
    $facet: {
      summary: [{
        $group: {
          _id: null,
          total: { $sum: 1 },
          travelersTotal: {
            $sum: { $ifNull: ["$totalPilgrims", { $size: { $ifNull: ["$pilgrims", []] } }] },
          },
          totalBookingValue: { $sum: { $ifNull: ["$pricing.totalPrice", 0] } },
          paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
          remainingAmount: { $sum: { $ifNull: ["$remainingAmount", 0] } },
        },
      }],
      byStatus: [{ $group: { _id: "$bookingStatus", count: { $sum: 1 } } }],
      byPaymentStatus: [{ $group: { _id: "$paymentStatus", count: { $sum: 1 } } }],
      programs: [
        { $match: { "program.programId": { $ne: null } } },
        {
          $group: {
            _id: "$program.programId",
            programNameAr: { $first: "$program.nameAr" },
            programNameEn: { $first: "$program.nameEn" },
            bookingsCount: { $sum: 1 },
            travelersCount: {
              $sum: { $ifNull: ["$totalPilgrims", { $size: { $ifNull: ["$pilgrims", []] } }] },
            },
            grossBookingValue: { $sum: { $ifNull: ["$pricing.totalPrice", 0] } },
            paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
          },
        },
        { $sort: { bookingsCount: -1 } },
      ],
      ...(includeAttention ? {
        attentionRows: [{
          $project: {
            _id: 1,
            bookingStatus: 1,
            paymentStatus: 1,
            payments: "$attentionPayments",
          },
        }],
      } : {}),
    },
  });
  return pipeline;
};

export const buildPaymentReportAggregation = (filter) => [{
  $match: filter,
}, {
  $facet: {
    summary: [{
      $group: {
        _id: null,
        total: { $sum: 1 },
        successful: statusCountExpression(SUCCESSFUL_TRANSACTION_STATUSES),
        failed: statusCountExpression(FAILED_TRANSACTION_STATUSES),
        pending: statusCountExpression(PENDING_TRANSACTION_STATUSES),
        refunded: statusCountExpression([
          PAYMENT_TRANSACTION_STATUSES.REFUNDED,
          PAYMENT_TRANSACTION_STATUSES.PARTIALLY_REFUNDED,
        ]),
        legacyPaid: statusCountExpression([LEGACY_PAYMENT_TRANSACTION_STATUSES.PAID]),
        paidPendingBooking: statusCountExpression([
          PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
        ]),
        bankPendingVerification: {
          $sum: { $cond: [{
            $and: [
              { $eq: ["$methodCode", PAYMENT_METHOD_CODES.BANK_TRANSFER] },
              { $eq: ["$status", PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION] },
            ],
          }, 1, 0] },
        },
        bankPendingReview: {
          $sum: { $cond: [{
            $and: [
              { $eq: ["$methodCode", PAYMENT_METHOD_CODES.BANK_TRANSFER] },
              { $in: ["$status", [...BANK_REVIEW_STATUSES]] },
            ],
          }, 1, 0] },
        },
      },
    }],
    byMethod: [{
      $group: {
        _id: { $ifNull: ["$methodCode", "UNSPECIFIED"] },
        transactionsCount: { $sum: 1 },
        totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
        settledAmount: {
          $sum: { $cond: [{ $in: ["$status", [...SUCCESSFUL_TRANSACTION_STATUSES]] }, { $ifNull: ["$amount", 0] }, 0] },
        },
      },
    }, { $sort: { settledAmount: -1 } }],
    byProvider: [{
      $group: {
        _id: { $cond: [{ $eq: [{ $ifNull: ["$providerCode", ""] }, ""] }, "NONE", "$providerCode"] },
        transactionsCount: { $sum: 1 },
        totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
        settledAmount: {
          $sum: { $cond: [{ $in: ["$status", [...SUCCESSFUL_TRANSACTION_STATUSES]] }, { $ifNull: ["$amount", 0] }, 0] },
        },
      },
    }, { $sort: { settledAmount: -1 } }],
  },
}];

const countsFromAggregation = (rows, keys) => ({
  ...Object.fromEntries(keys.map((key) => [key, 0])),
  ...Object.fromEntries((rows || []).map((row) => [String(row._id || "").toLowerCase(), row.count])),
});

const groupsFromAggregation = (rows = []) => rows.map((row) => ({
  code: row._id,
  transactionsCount: row.transactionsCount,
  totalAmount: money(row.totalAmount),
  settledAmount: money(row.settledAmount),
}));

const reportsFromAggregations = ({ bookingAggregation = {}, paymentAggregation = {} }) => {
  const bookingSummary = bookingAggregation.summary?.[0] || {};
  const paymentSummary = paymentAggregation.summary?.[0] || {};
  const paymentStatusesByBooking = new Map(
    (bookingAggregation.attentionRows || []).map((row) => [
      String(row._id),
      row.payments || [],
    ]),
  );
  const attentionRequired = (bookingAggregation.attentionRows || []).reduce(
    (count, row) => count + Number(deriveAttentionRequired({
      booking: row,
      payments: paymentStatusesByBooking.get(String(row._id)) || [],
    })),
    0,
  );
  const byStatus = countsFromAggregation(bookingAggregation.byStatus, BOOKING_STATUS_LIST);
  const byPaymentStatus = countsFromAggregation(
    bookingAggregation.byPaymentStatus,
    PAYMENT_STATUS_LIST,
  );
  const bookings = {
    total: bookingSummary.total || 0,
    byStatus,
    byPaymentStatus,
    confirmed: byStatus[BOOKING_STATUS.CONFIRMED] || 0,
    pending: byStatus[BOOKING_STATUS.PENDING] || 0,
    cancelled: byStatus[BOOKING_STATUS.CANCELLED] || 0,
    travelers: { total: bookingSummary.travelersTotal || 0 },
    attentionRequired,
  };
  const payments = {
    totalBookingValue: money(bookingSummary.totalBookingValue),
    paidAmount: money(bookingSummary.paidAmount),
    remainingAmount: money(bookingSummary.remainingAmount),
    transactions: {
      total: paymentSummary.total || 0,
      successful: paymentSummary.successful || 0,
      failed: paymentSummary.failed || 0,
      pending: paymentSummary.pending || 0,
      refunded: paymentSummary.refunded || 0,
      legacyPaid: paymentSummary.legacyPaid || 0,
    },
    byMethod: groupsFromAggregation(paymentAggregation.byMethod),
    byProvider: groupsFromAggregation(paymentAggregation.byProvider),
    bankTransfers: {
      pendingVerification: paymentSummary.bankPendingVerification || 0,
      pendingReview: paymentSummary.bankPendingReview || 0,
    },
    paidPendingBooking: paymentSummary.paidPendingBooking || 0,
  };
  const programs = (bookingAggregation.programs || []).map((row) => ({
    programId: row._id,
    programNameAr: row.programNameAr || "",
    programNameEn: row.programNameEn || "",
    bookingsCount: row.bookingsCount || 0,
    travelersCount: row.travelersCount || 0,
    grossBookingValue: money(row.grossBookingValue),
    paidAmount: money(row.paidAmount),
  }));
  return { bookings, payments, programs };
};

const defaultRepository = {
  aggregateBookings: async (filter, options) =>
    (await Booking.aggregate(buildBookingReportAggregation(filter, options)))[0] || {},
  aggregatePayments: async (filter) =>
    (await PaymentTransaction.aggregate(buildPaymentReportAggregation(filter)))[0] || {},
  findBookingIds: (filter) => Booking.distinct("_id", filter),
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

  const loadAggregatedReports = async (
    rawFilters = {},
    { includePayments = true, includeAttention = true } = {},
  ) => {
    const filters = normalizeReportFilters(rawFilters);
    const paymentMethodBookingIds = filters.paymentMethod
      ? await repo.findBookingIdsByPaymentMethod(filters.paymentMethod)
      : [];
    const bookingFilter = buildReportBookingFilter(filters, paymentMethodBookingIds);
    const hasBookingDimensionFilter = Boolean(
      filters.bookingStatus || filters.paymentStatus || filters.programId,
    );
    const dimensionBookingIds = includePayments && hasBookingDimensionFilter
      ? await repo.findBookingIds(bookingFilter)
      : null;
    const [bookingAggregation, paymentAggregation] = await Promise.all([
      repo.aggregateBookings(bookingFilter, { includeAttention }),
      includePayments
        ? repo.aggregatePayments(buildReportPaymentFilter(
          filters,
          dimensionBookingIds,
        ))
        : {},
    ]);
    return reportsFromAggregations({ bookingAggregation, paymentAggregation });
  };

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
    if (typeof repo.aggregateBookings === "function" && !repository.getBookings) {
      return (await loadAggregatedReports(filters, {
        includePayments: false,
        includeAttention: true,
      })).bookings;
    }
    const context = await loadReportContext(filters, {
      includePayments: false,
      includeAttention: true,
    });
    return buildBookingReport(context);
  };

  const getPaymentsReportService = async (filters) => {
    if (typeof repo.aggregateBookings === "function" && !repository.getBookings) {
      return (await loadAggregatedReports(filters, {
        includePayments: true,
        includeAttention: false,
      })).payments;
    }
    const context = await loadReportContext(filters, {
      includePayments: true,
      includeAttention: false,
    });
    return buildPaymentReport(context);
  };

  const getProgramsReportService = async (filters) => {
    if (typeof repo.aggregateBookings === "function" && !repository.getBookings) {
      return (await loadAggregatedReports(filters, {
        includePayments: false,
        includeAttention: false,
      })).programs;
    }
    const context = await loadReportContext(filters, {
      includePayments: false,
      includeAttention: false,
    });
    return buildProgramReport(context);
  };

  const getReportsOverviewService = async (filters) => {
    if (typeof repo.aggregateBookings === "function" && !repository.getBookings) {
      const reports = await loadAggregatedReports(filters);
      return {
        bookings: {
          total: reports.bookings.total,
          confirmed: reports.bookings.confirmed,
          pending: reports.bookings.pending,
          cancelled: reports.bookings.cancelled,
          attentionRequired: reports.bookings.attentionRequired,
          byStatus: reports.bookings.byStatus,
          byPaymentStatus: reports.bookings.byPaymentStatus,
        },
        travelers: reports.bookings.travelers,
        payments: {
          totalAmount: reports.payments.totalBookingValue,
          paidAmount: reports.payments.paidAmount,
          remainingAmount: reports.payments.remainingAmount,
          successfulTransactions: reports.payments.transactions.successful,
          failedTransactions: reports.payments.transactions.failed,
          pendingTransactions: reports.payments.transactions.pending,
          paidPendingBooking: reports.payments.paidPendingBooking,
        },
        bankTransfers: reports.payments.bankTransfers,
        reports,
      };
    }
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
