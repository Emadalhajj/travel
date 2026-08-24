import assert from "node:assert/strict";
import test from "node:test";

import { USER_ROLES } from "../../constants/auth/roles.js";
import { PAYMENT_METHOD_CODES } from "../../constants/payments/payment-method-codes.js";
import { PAYMENT_TRANSACTION_STATUSES } from "../../constants/payments/payment-transaction-statuses.js";
import { REPORT_READ_ROLES } from "../../routes/reports/report-route.js";
import {
  buildBookingReport,
  buildPaymentReport,
  buildProgramReport,
  buildReportBookingFilter,
  buildReportPaymentFilter,
  createReportServiceLayer,
  normalizeReportFilters,
} from "../../services/reports/report-service.js";

const programOne = "507f1f77bcf86cd799439021";
const programTwo = "507f1f77bcf86cd799439022";
const bookings = [
  {
    _id: "507f1f77bcf86cd799439011",
    bookingStatus: "confirmed",
    paymentStatus: "paid",
    totalPilgrims: 2,
    pricing: { totalPrice: 100 },
    paidAmount: 100,
    remainingAmount: 0,
    program: { programId: programOne, nameAr: "الأول", nameEn: "First" },
  },
  {
    _id: "507f1f77bcf86cd799439012",
    bookingStatus: "pending",
    paymentStatus: "partial",
    totalPilgrims: 1,
    pricing: { totalPrice: 200 },
    paidAmount: 50,
    remainingAmount: 150,
    program: { programId: programOne, nameAr: "الأول", nameEn: "First" },
  },
  {
    _id: "507f1f77bcf86cd799439013",
    bookingStatus: "cancelled",
    paymentStatus: "failed",
    totalPilgrims: 3,
    pricing: { totalPrice: 300 },
    paidAmount: 0,
    remainingAmount: 300,
    program: { programId: programTwo, nameAr: "الثاني", nameEn: "Second" },
  },
];

const payments = [
  {
    booking: bookings[0]._id,
    methodCode: PAYMENT_METHOD_CODES.CARD,
    providerCode: "STRIPE",
    status: PAYMENT_TRANSACTION_STATUSES.CAPTURED,
    amount: 100,
    metadata: { apiKey: "must-not-leak" },
  },
  {
    booking: bookings[2]._id,
    methodCode: PAYMENT_METHOD_CODES.CARD,
    providerCode: "STRIPE",
    status: PAYMENT_TRANSACTION_STATUSES.FAILED,
    amount: 300,
    gatewayResponse: { accessToken: "must-not-leak" },
  },
  {
    booking: null,
    methodCode: PAYMENT_METHOD_CODES.BANK_TRANSFER,
    providerCode: "",
    status: PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
    amount: 50,
  },
  {
    booking: bookings[1]._id,
    methodCode: PAYMENT_METHOD_CODES.CARD,
    providerCode: "STRIPE",
    status: PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING,
    amount: 50,
  },
];

const paymentStatusesByBooking = new Map([
  [bookings[0]._id, [{ status: PAYMENT_TRANSACTION_STATUSES.CAPTURED }]],
  [bookings[1]._id, [{ status: PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING }]],
  [bookings[2]._id, [{ status: PAYMENT_TRANSACTION_STATUSES.FAILED }]],
]);

test("date range and shared report filters are validated and applied", () => {
  const filters = normalizeReportFilters({
    dateFrom: "2026-08-01",
    dateTo: "2026-08-20",
    bookingStatus: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "card",
    programId: programOne,
  });
  const bookingFilter = buildReportBookingFilter(filters, [bookings[0]._id]);
  const paymentFilter = buildReportPaymentFilter(filters, [bookings[0]._id]);
  assert.equal(bookingFilter.createdAt.$gte.toISOString(), "2026-08-01T00:00:00.000Z");
  assert.equal(bookingFilter.createdAt.$lte.toISOString(), "2026-08-20T23:59:59.999Z");
  assert.equal(bookingFilter.bookingStatus, "confirmed");
  assert.equal(paymentFilter.methodCode, PAYMENT_METHOD_CODES.CARD);
  assert.deepEqual(paymentFilter.booking.$in, [bookings[0]._id]);
  assert.throws(() => normalizeReportFilters({ bookingStatus: "unknown" }), ({ field }) => field === "bookingStatus");
});

test("booking report calculates status totals, travelers and attentionRequired", () => {
  const report = buildBookingReport({ bookings, paymentStatusesByBooking });
  assert.equal(report.total, 3);
  assert.equal(report.byStatus.confirmed, 1);
  assert.equal(report.byStatus.pending, 1);
  assert.equal(report.byStatus.cancelled, 1);
  assert.equal(report.travelers.total, 6);
  assert.equal(report.attentionRequired, 2);
});

test("payment report calculates financial totals and transaction categories", () => {
  const report = buildPaymentReport({ bookings, payments });
  assert.equal(report.totalBookingValue, 600);
  assert.equal(report.paidAmount, 150);
  assert.equal(report.remainingAmount, 450);
  assert.equal(report.transactions.successful, 2);
  assert.equal(report.transactions.failed, 1);
  assert.equal(report.transactions.pending, 1);
  assert.equal(report.bankTransfers.pendingVerification, 1);
  assert.equal(report.paidPendingBooking, 1);
  assert.equal(report.byMethod.find((item) => item.code === PAYMENT_METHOD_CODES.CARD).transactionsCount, 3);
  assert.equal(report.byProvider.find((item) => item.code === "STRIPE").settledAmount, 150);
});

test("program report aggregates bookings, travelers and money", () => {
  const report = buildProgramReport({ bookings });
  assert.equal(report[0].programId, programOne);
  assert.equal(report[0].bookingsCount, 2);
  assert.equal(report[0].travelersCount, 3);
  assert.equal(report[0].grossBookingValue, 300);
  assert.equal(report[0].paidAmount, 150);
});

test("overview is built in backend and exposes no sensitive payment data", async () => {
  const service = createReportServiceLayer({
    findBookingIdsByPaymentMethod: async () => [],
    getBookings: async () => bookings,
    getPayments: async () => payments,
    getPaymentStatusesForBookings: async () => payments.filter((payment) => payment.booking),
  });
  const overview = await service.getReportsOverviewService({});
  assert.equal(overview.bookings.total, 3);
  assert.equal(overview.travelers.total, 6);
  assert.equal(overview.payments.totalAmount, 600);
  assert.equal(overview.bankTransfers.pendingVerification, 1);
  const serialized = JSON.stringify(overview);
  assert.equal(serialized.includes("must-not-leak"), false);
  assert.equal(serialized.includes("metadata"), false);
  assert.equal(serialized.includes("gatewayResponse"), false);
});

test("report routes allow admin and super admin only", () => {
  assert.equal(REPORT_READ_ROLES.includes(USER_ROLES.ADMIN), true);
  assert.equal(REPORT_READ_ROLES.includes(USER_ROLES.SUPER_ADMIN), true);
  assert.equal(REPORT_READ_ROLES.includes(USER_ROLES.USER), false);
});
