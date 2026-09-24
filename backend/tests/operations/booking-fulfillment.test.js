import test from "node:test";
import assert from "node:assert/strict";

import {
  FULFILLMENT_STATUS,
  buildInitialFulfillment,
  getFulfillmentSteps,
} from "../../constants/booking/booking-fulfillment.js";
import {
  isSameFulfillment,
  updateBookingFulfillmentService,
  submitCustomerFulfillmentActionService,
  validateFulfillmentTransition,
} from "../../services/operations/booking-fulfillment-service.js";

test("builds a provider-confirmed initial state for a paid external flight", () => {
  const fulfillment = buildInitialFulfillment({
    serviceType: "FLIGHT",
    paymentStatus: "paid",
    bookingItems: { trip: { external: { providerOrderId: "ord_123" } } },
  });
  assert.equal(fulfillment.serviceType, "FLIGHT");
  assert.equal(fulfillment.currentStep, "PROVIDER_CONFIRMED");
  assert.equal(fulfillment.status, FULFILLMENT_STATUS.IN_PROGRESS);
});

test("uses a service-specific workflow", () => {
  assert.deepEqual(getFulfillmentSteps("VISA"), [
    "REQUEST_RECEIVED",
    "DOCUMENTS_REVIEW",
    "APPLICATION_SUBMITTED",
    "UNDER_PROCESSING",
    "VISA_ISSUED",
    "DELIVERED",
  ]);
});

test("rejects skipped fulfillment steps", () => {
  assert.throws(
    () => validateFulfillmentTransition({
      booking: {
        paymentStatus: "paid",
        fulfillment: { serviceType: "FLIGHT", status: "in_progress", currentStep: "PAYMENT_RECEIVED" },
      },
      nextStep: "TICKET_ISSUED",
      status: "in_progress",
    }),
    ({ message, field }) => message === "INVALID_FULFILLMENT_TRANSITION" && field === "currentStep",
  );
});

test("rejects operational progress before payment", () => {
  assert.throws(
    () => validateFulfillmentTransition({
      booking: {
        paymentStatus: "pending",
        fulfillment: { serviceType: "HOTEL", status: "pending", currentStep: "REQUEST_RECEIVED" },
      },
      nextStep: "AVAILABILITY_CHECK",
      status: "in_progress",
    }),
    ({ message, field }) => message === "FULFILLMENT_PAYMENT_REQUIRED" && field === "paymentStatus",
  );
});

test("allows action-required to resume in progress on the same step", () => {
  const result = validateFulfillmentTransition({
    booking: {
      paymentStatus: "paid",
      fulfillment: {
        serviceType: "VISA",
        status: "action_required",
        currentStep: "DOCUMENTS_REVIEW",
      },
    },
    nextStep: "DOCUMENTS_REVIEW",
    status: "in_progress",
  });
  assert.equal(result.nextIndex, 1);
});

test("does not allow completed before the last workflow step", () => {
  assert.throws(
    () => validateFulfillmentTransition({
      booking: {
        paymentStatus: "paid",
        fulfillment: { serviceType: "FLIGHT", status: "in_progress", currentStep: "TICKET_ISSUED" },
      },
      nextStep: "TICKET_ISSUED",
      status: "completed",
    }),
    ({ message }) => message === "INVALID_FULFILLMENT_TRANSITION",
  );
});

test("failed and cancelled are terminal and cannot skip a step while being set", () => {
  const base = {
    paymentStatus: "paid",
    fulfillment: { serviceType: "HOTEL", status: "in_progress", currentStep: "AVAILABILITY_CHECK" },
  };
  assert.doesNotThrow(() => validateFulfillmentTransition({
    booking: base,
    nextStep: "AVAILABILITY_CHECK",
    status: "failed",
  }));
  assert.throws(() => validateFulfillmentTransition({
    booking: base,
    nextStep: "BOOKING_REQUESTED",
    status: "cancelled",
  }));
  assert.throws(
    () => validateFulfillmentTransition({
      booking: {
        paymentStatus: "paid",
        fulfillment: { serviceType: "HOTEL", status: "failed", currentStep: "AVAILABILITY_CHECK" },
      },
      nextStep: "AVAILABILITY_CHECK",
      status: "in_progress",
    }),
    ({ message }) => message === "FULFILLMENT_TERMINAL",
  );
});

test("identifies an exact repeated administrative request as idempotent", () => {
  const state = {
    serviceType: "VISA",
    status: "action_required",
    currentStep: "DOCUMENTS_REVIEW",
    actionRequiredReason: "Upload a clear passport copy",
  };
  assert.equal(isSameFulfillment(state, { ...state }), true);
  assert.equal(isSameFulfillment(state, { ...state, actionRequiredReason: "Different request" }), false);
});

const BOOKING_ID = "507f1f77bcf86cd799439011";
const baseBooking = () => ({
  _id: BOOKING_ID,
  __v: 3,
  user: "507f1f77bcf86cd799439012",
  bookingNumber: "BK-TEST",
  paymentStatus: "paid",
  bookingStatus: "confirmed",
  customer: { email: "customer@example.com" },
  fulfillment: {
    serviceType: "HOTEL",
    status: "in_progress",
    currentStep: "REQUEST_RECEIVED",
    startedAt: new Date("2026-09-15T00:00:00Z"),
    actionRequiredReason: "",
  },
});

test("an exact retry does not write booking, log, audit, or notification twice", async () => {
  const calls = { cas: 0, log: 0, audit: 0, notify: 0 };
  const result = await updateBookingFulfillmentService({
    bookingId: BOOKING_ID,
    nextStep: "REQUEST_RECEIVED",
    status: "in_progress",
    dependencies: {
      findBooking: async () => baseBooking(),
      compareAndSetBooking: async () => { calls.cas += 1; },
      createBookingLog: async () => { calls.log += 1; },
      createAudit: async () => { calls.audit += 1; },
      notify: async () => { calls.notify += 1; },
    },
  });
  assert.equal(result.currentStep, "REQUEST_RECEIVED");
  assert.deepEqual(calls, { cas: 0, log: 0, audit: 0, notify: 0 });
});

test("a successful compare-and-set writes one log and one audit", async () => {
  const calls = { log: 0, audit: 0 };
  const booking = baseBooking();
  await updateBookingFulfillmentService({
    bookingId: BOOKING_ID,
    nextStep: "AVAILABILITY_CHECK",
    status: "in_progress",
    userId: "507f1f77bcf86cd799439013",
    dependencies: {
      findBooking: async () => booking,
      compareAndSetBooking: async (_filter, update) => ({
        ...booking,
        __v: 4,
        fulfillment: update.$set.fulfillment,
      }),
      createBookingLog: async () => { calls.log += 1; },
      createAudit: async () => { calls.audit += 1; },
      notify: async () => { throw new Error("notification should not run for this step"); },
    },
  });
  assert.deepEqual(calls, { log: 1, audit: 1 });
});

test("a concurrent identical winner is treated as an idempotent success by the loser", async () => {
  const original = baseBooking();
  let reads = 0;
  const calls = { log: 0, audit: 0, notify: 0 };
  const result = await updateBookingFulfillmentService({
    bookingId: BOOKING_ID,
    nextStep: "AVAILABILITY_CHECK",
    status: "in_progress",
    dependencies: {
      findBooking: async () => {
        reads += 1;
        return reads === 1 ? original : {
          ...original,
          __v: 4,
          fulfillment: {
            ...original.fulfillment,
            status: "in_progress",
            currentStep: "AVAILABILITY_CHECK",
            actionRequiredReason: "",
          },
        };
      },
      compareAndSetBooking: async () => null,
      createBookingLog: async () => { calls.log += 1; },
      createAudit: async () => { calls.audit += 1; },
      notify: async () => { calls.notify += 1; },
    },
  });
  assert.equal(result.currentStep, "AVAILABILITY_CHECK");
  assert.deepEqual(calls, { log: 0, audit: 0, notify: 0 });
});

test("customer action response is ownership-scoped and resumes the same step", async () => {
  const booking = {
    ...baseBooking(),
    fulfillment: {
      serviceType: "HOTEL",
      status: "action_required",
      currentStep: "AVAILABILITY_CHECK",
      actionRequiredReason: "Upload confirmation",
      customerAction: { status: "requested", requestedAt: new Date() },
    },
  };
  let ownershipFilter;
  let updatePayload;
  const calls = { log: 0, audit: 0 };
  const result = await submitCustomerFulfillmentActionService({
    bookingId: BOOKING_ID,
    userId: booking.user,
    note: "Attached",
    files: [{ filename: "safe.pdf", originalname: "document.pdf", mimetype: "application/pdf", size: 12 }],
    dependencies: {
      findBooking: async (filter) => { ownershipFilter = filter; return booking; },
      compareAndSetBooking: async (_filter, update) => {
        updatePayload = update;
        return { ...booking, fulfillment: update.$set.fulfillment };
      },
      createBookingLog: async () => { calls.log += 1; },
      createAudit: async () => { calls.audit += 1; },
    },
  });
  assert.equal(String(ownershipFilter.user), String(booking.user));
  assert.equal(updatePayload.$set.fulfillment.currentStep, "AVAILABILITY_CHECK");
  assert.equal(result.status, "in_progress");
  assert.equal(result.customerAction.status, "submitted");
  assert.match(result.customerAction.documents[0].url, /private-files\/booking-actions/);
  assert.deepEqual(calls, { log: 1, audit: 1 });
});

test("repeated customer submission after success is idempotent", async () => {
  const booking = {
    ...baseBooking(),
    fulfillment: {
      ...baseBooking().fulfillment,
      customerAction: { status: "submitted", submittedAt: new Date(), documents: [] },
    },
  };
  let writes = 0;
  const result = await submitCustomerFulfillmentActionService({
    bookingId: BOOKING_ID,
    userId: booking.user,
    note: "Repeated",
    dependencies: {
      findBooking: async () => booking,
      compareAndSetBooking: async () => { writes += 1; },
      createBookingLog: async () => { writes += 1; },
      createAudit: async () => { writes += 1; },
    },
  });
  assert.equal(result.customerAction.status, "submitted");
  assert.equal(writes, 0);
});
