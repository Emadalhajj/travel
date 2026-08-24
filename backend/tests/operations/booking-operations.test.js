import assert from "node:assert/strict";
import test from "node:test";

import { USER_ROLES } from "../../constants/auth/roles.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";
import { PAYMENT_METHOD_CODES } from "../../constants/payments/payment-method-codes.js";
import { PAYMENT_TRANSACTION_STATUSES } from "../../constants/payments/payment-transaction-statuses.js";
import {
  buildOperationsBookingFilter,
  createBookingOperationsServiceLayer,
  deriveAttentionRequired,
  normalizeOperationsPagination,
} from "../../services/operations/booking-operations-service.js";
import { OPERATIONS_READ_ROLES } from "../../routes/operations/booking-operations-route.js";

const bookingId = "507f1f77bcf86cd799439011";
const paymentId = "507f191e810c19729de860ea";
const actor = {
  _id: "507f191e810c19729de860eb",
  firstName: "Admin",
  role: USER_ROLES.ADMIN,
};

const repository = (overrides = {}) => ({
  getBooking: async () => ({
    _id: bookingId,
    bookingNumber: "BK-000001",
    bookingStatus: "confirmed",
    paymentStatus: "paid",
    customer: { name: "Customer" },
    pilgrims: [],
    pricing: { totalPrice: 100, currency: "SAR" },
    createdAt: new Date("2026-08-01T00:00:00Z"),
  }),
  getPayments: async (requestedBookingId) => {
    assert.equal(requestedBookingId, bookingId);
    return [{
      _id: paymentId,
      booking: bookingId,
      methodCode: PAYMENT_METHOD_CODES.CARD,
      status: PAYMENT_TRANSACTION_STATUSES.CAPTURED,
      amount: 100,
      currency: "SAR",
      metadata: { accessToken: "must-not-leak" },
      gatewayResponse: { secret: "must-not-leak" },
      events: [],
      createdAt: new Date("2026-08-02T00:00:00Z"),
    }];
  },
  getTimeline: async () => [
    { _id: "2", action: "second", createdAt: new Date("2026-08-03T00:00:00Z"), performedBy: actor },
    { _id: "1", action: "first", createdAt: new Date("2026-08-01T00:00:00Z"), performedBy: actor },
  ],
  getAudit: async ({ bookingId: requestedBookingId, paymentIds }) => {
    assert.equal(requestedBookingId, bookingId);
    assert.deepEqual(paymentIds, [paymentId]);
    return [
      { entity: AUDIT_ENTITIES.BOOKING, entityId: bookingId, after: { password: "hidden" }, createdAt: new Date("2026-08-01T00:00:00Z") },
      { entity: AUDIT_ENTITIES.PAYMENT_TRANSACTION, entityId: paymentId, metadata: { apiKey: "hidden" }, createdAt: new Date("2026-08-02T00:00:00Z") },
    ];
  },
  getInventoryHolds: async () => [],
  ...overrides,
});

test("admin Booking 360 contains only linked payments and booking plus payment audit", async () => {
  const service = createBookingOperationsServiceLayer(repository());
  const result = await service.getBookingOperationsDetailsService({ bookingId });
  assert.equal(result.booking.id, bookingId);
  assert.deepEqual(result.payments.map((payment) => payment.id), [paymentId]);
  assert.deepEqual(result.audit.map((entry) => entry.entity), [
    AUDIT_ENTITIES.BOOKING,
    AUDIT_ENTITIES.PAYMENT_TRANSACTION,
  ]);
});

test("missing booking returns 404", async () => {
  const service = createBookingOperationsServiceLayer(repository({ getBooking: async () => null }));
  await assert.rejects(
    service.getBookingOperationsDetailsService({ bookingId }),
    ({ statusCode, field }) => statusCode === 404 && field === "bookingId",
  );
});

test("timeline is chronological and actors use real User fields", async () => {
  const service = createBookingOperationsServiceLayer(repository());
  const result = await service.getBookingOperationsDetailsService({ bookingId });
  assert.deepEqual(result.timeline.map((entry) => entry.action), ["first", "second"]);
  assert.equal(result.timeline[0].performedBy.firstName, "Admin");
});

test("operations response does not expose raw provider data or audit secrets", async () => {
  const service = createBookingOperationsServiceLayer(repository());
  const result = await service.getBookingOperationsDetailsService({ bookingId });
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("must-not-leak"), false);
  assert.equal(serialized.includes('"password":"hidden"'), false);
  assert.equal(serialized.includes('"apiKey":"hidden"'), false);
  assert.equal(result.audit[0].after.password, "[REDACTED]");
});

test("pagination is bounded and operational filters are validated", () => {
  assert.deepEqual(normalizeOperationsPagination({ page: -1, limit: 5000 }), { page: 1, limit: 100 });
  const filter = buildOperationsBookingFilter({
    bookingStatus: "confirmed",
    paymentStatus: "paid",
    paymentMethod: PAYMENT_METHOD_CODES.CARD,
    paymentMethodBookingIds: [bookingId],
    dateFrom: "2026-08-01",
    dateTo: "2026-08-20",
    search: "BK-000001",
  });
  assert.equal(filter.bookingStatus, "confirmed");
  assert.equal(filter.paymentStatus, "paid");
  assert.equal(filter.createdAt.$lte.toISOString(), "2026-08-20T23:59:59.999Z");
  assert.equal(filter.$and.length, 2);
  assert.throws(() => buildOperationsBookingFilter({ bookingStatus: "unknown" }), ({ field }) => field === "bookingStatus");
});

test("operations list applies filters, bounded pagination and derived attention", async () => {
  let receivedQuery = null;
  const service = createBookingOperationsServiceLayer(repository({
    findBookingIdsByPaymentMethod: async () => [bookingId],
    listBookings: async (query) => {
      receivedQuery = query;
      return [{
        _id: bookingId,
        bookingNumber: "BK-000001",
        bookingStatus: "confirmed",
        paymentStatus: "pending",
        createdAt: new Date("2026-08-10T00:00:00Z"),
      }];
    },
    countBookings: async () => 1,
    getPaymentSummaries: async () => [{
      _id: paymentId,
      booking: bookingId,
      methodCode: PAYMENT_METHOD_CODES.CARD,
      status: PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
      createdAt: new Date("2026-08-10T01:00:00Z"),
    }],
  }));
  const result = await service.listBookingOperationsService({
    bookingStatus: "confirmed",
    paymentMethod: PAYMENT_METHOD_CODES.CARD,
    dateFrom: "2026-08-01",
    dateTo: "2026-08-20",
    page: 1,
    limit: 1000,
  });
  assert.equal(receivedQuery.limit, 100);
  assert.equal(receivedQuery.filter.bookingStatus, "confirmed");
  assert.equal(result.items[0].attentionRequired, true);
  assert.equal(result.pagination.total, 1);
});

test("paid pending booking is attentionRequired", () => {
  assert.equal(deriveAttentionRequired({
    booking: { paymentStatus: "paid" },
    payments: [{ status: PAYMENT_TRANSACTION_STATUSES.PAID_PENDING_BOOKING }],
  }), true);
  assert.equal(deriveAttentionRequired({
    booking: { bookingStatus: "cancelled", paymentStatus: "paid" },
    payments: [{ status: PAYMENT_TRANSACTION_STATUSES.CAPTURED }],
  }), true);
});

test("operations routes allow admin and super admin and forbid user", () => {
  assert.equal(OPERATIONS_READ_ROLES.includes(USER_ROLES.ADMIN), true);
  assert.equal(OPERATIONS_READ_ROLES.includes(USER_ROLES.SUPER_ADMIN), true);
  assert.equal(OPERATIONS_READ_ROLES.includes(USER_ROLES.USER), false);
});
