import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { EXTERNAL_FULFILLMENT_STATUSES } from
  "../../constants/payments/external-fulfillment-statuses.js";
import { createExternalFlightFulfillmentLayer } from
  "../../services/trips/external-flight-fulfillment-service.js";
import {
  createDuffelWebhookHandler,
  verifyDuffelWebhookSignature,
} from "../../services/trips/duffel-webhook-service.js";
import Booking from "../../models/booking/booking-model.js";

const draft = {
  trip: {
    external: {
      provider: "DUFFEL",
      offerId: "off_1",
      paymentRequirements: { requiresInstantPayment: false },
    },
  },
  travelers: [],
};

const createFixture = ({ orderStatus = "CONFIRMED", createError = null } = {}) => {
  let createCalls = 0;
  let state = {
    _id: "pay_1",
    draftBooking: "draft_1",
    externalFulfillment: { required: false, status: "NOT_REQUIRED" },
  };
  const update = async ({ status, updates = {} }) => {
    state = {
      ...state,
      externalFulfillment: { ...state.externalFulfillment, ...updates, status },
    };
    return state;
  };
  const layer = createExternalFlightFulfillmentLayer({
    loadDraft: async () => draft,
    findTransaction: async () => state,
    initialize: async ({ provider, offerId }) => update({
      status: EXTERNAL_FULFILLMENT_STATUSES.PENDING,
      updates: { required: true, provider, offerId },
    }),
    acquire: async () => state.externalFulfillment.status === "PENDING"
      ? update({ status: EXTERNAL_FULFILLMENT_STATUSES.PROCESSING })
      : null,
    update,
    createOrder: async () => {
      createCalls += 1;
      if (createError) throw createError;
      return {
        provider: "DUFFEL",
        orderId: "ord_1",
        offerId: "off_1",
        status: orderStatus,
        total: { amount: 100, currency: "SAR" },
        slices: [],
        passengers: [],
      };
    },
    getOrder: async () => ({
      provider: "DUFFEL", orderId: "ord_1", offerId: "off_1",
      status: "CONFIRMED", slices: [], passengers: [],
    }),
    findOrders: async () => [],
  });
  return { layer, transaction: state, getState: () => state, getCreateCalls: () => createCalls };
};

test("external fulfillment creates one order and reuses the confirmed result", async () => {
  const fixture = createFixture();
  const first = await fixture.layer.fulfillExternalFlight({
    transaction: fixture.transaction,
  });
  const second = await fixture.layer.fulfillExternalFlight({
    transaction: fixture.getState(),
  });
  assert.equal(first.confirmed, true);
  assert.equal(second.confirmed, true);
  assert.equal(fixture.getCreateCalls(), 1);
  assert.equal(fixture.getState().externalFulfillment.orderSnapshot.orderId, "ord_1");
});

test("202/pending order is reconciled without a second POST", async () => {
  const fixture = createFixture({ orderStatus: "PENDING" });
  const first = await fixture.layer.fulfillExternalFlight({ transaction: fixture.transaction });
  const second = await fixture.layer.fulfillExternalFlight({ transaction: fixture.getState() });
  assert.equal(first.confirmed, false);
  assert.equal(second.confirmed, true);
  assert.equal(fixture.getCreateCalls(), 1);
});

test("ambiguous timeout becomes awaiting provider and never blindly retries POST", async () => {
  const error = new Error("timeout");
  error.code = "FLIGHT_PROVIDER_TIMEOUT";
  const fixture = createFixture({ createError: error });
  await fixture.layer.fulfillExternalFlight({ transaction: fixture.transaction });
  await fixture.layer.fulfillExternalFlight({ transaction: fixture.getState() });
  assert.equal(fixture.getCreateCalls(), 1);
  assert.equal(
    fixture.getState().externalFulfillment.status,
    EXTERNAL_FULFILLMENT_STATUSES.AWAITING_PROVIDER,
  );
});

test("Duffel webhook signature uses timestamp plus the exact raw body", () => {
  const rawBody = Buffer.from('{"id":"wev_1"}');
  const timestamp = 1_700_000_000;
  const secret = "test-secret";
  const digest = crypto.createHmac("sha256", secret)
    .update(Buffer.concat([Buffer.from(`${timestamp}.`), rawBody]))
    .digest("hex");
  assert.equal(verifyDuffelWebhookSignature({
    rawBody,
    signature: `t=${timestamp},v1=${digest}`,
    secret,
    now: timestamp * 1000,
  }), true);
  assert.equal(verifyDuffelWebhookSignature({
    rawBody: Buffer.from("tampered"),
    signature: `t=${timestamp},v1=${digest}`,
    secret,
    now: timestamp * 1000,
  }), false);
});

test("duplicate and out-of-order Duffel events cannot overwrite confirmed fulfillment", async () => {
  let status = EXTERNAL_FULFILLMENT_STATUSES.AWAITING_PROVIDER;
  const seen = new Set();
  const handler = createDuffelWebhookHandler({
    findTransaction: async () => ({
      _id: "pay_1",
      externalFulfillment: { status, processedEventIds: [...seen] },
    }),
    claimEvent: async ({ eventId }) => {
      if (seen.has(eventId)) return null;
      seen.add(eventId);
      return { _id: "pay_1" };
    },
    update: async ({ status: next }) => { status = next; },
    getOrder: async () => ({
      provider: "DUFFEL", orderId: "ord_1", offerId: "off_1",
      status: "CONFIRMED", slices: [], passengers: [],
    }),
  });
  const created = { id: "wev_1", type: "order.created", idempotency_key: "ord_1" };
  const failed = { id: "wev_2", type: "order.creation_failed", idempotency_key: "ord_1" };
  await handler({ event: created });
  const duplicate = await handler({ event: created });
  await handler({ event: failed });
  assert.equal(duplicate.duplicate, true);
  assert.equal(status, EXTERNAL_FULFILLMENT_STATUSES.CONFIRMED);
});

test("concurrent fulfillment calls can acquire only one create attempt", async () => {
  let state = {
    _id: "pay_1",
    draftBooking: "draft_1",
    externalFulfillment: {
      required: true,
      provider: "DUFFEL",
      offerId: "off_1",
      status: EXTERNAL_FULFILLMENT_STATUSES.PENDING,
    },
  };
  let createCalls = 0;
  const layer = createExternalFlightFulfillmentLayer({
    loadDraft: async () => draft,
    findTransaction: async () => state,
    acquire: async () => {
      if (state.externalFulfillment.status !== EXTERNAL_FULFILLMENT_STATUSES.PENDING) {
        return null;
      }
      state = {
        ...state,
        externalFulfillment: {
          ...state.externalFulfillment,
          status: EXTERNAL_FULFILLMENT_STATUSES.PROCESSING,
        },
      };
      return state;
    },
    update: async ({ status, updates }) => {
      state = { ...state, externalFulfillment: { ...state.externalFulfillment, ...updates, status } };
      return state;
    },
    createOrder: async () => {
      createCalls += 1;
      return { provider: "DUFFEL", orderId: "ord_1", offerId: "off_1", status: "CONFIRMED" };
    },
    getOrder: async () => ({ provider: "DUFFEL", orderId: "ord_1", status: "CONFIRMED" }),
    findOrders: async () => [],
  });
  await Promise.all([
    layer.fulfillExternalFlight({ transaction: state, draft }),
    layer.fulfillExternalFlight({ transaction: state, draft }),
  ]);
  assert.equal(createCalls, 1);
});

test("Booking stores only the normalized historical external order snapshot", () => {
  const booking = new Booking({
    bookingNumber: "B-EXT-1",
    user: "507f1f77bcf86cd799439011",
    bookingItems: {
      trip: {
        external: {
          provider: "DUFFEL",
          orderId: "ord_1",
          bookingReference: "ABC123",
          status: "CONFIRMED",
          total: { amount: 100, currency: "SAR" },
          slices: [],
          passengers: [{ providerPassengerId: "pas_1", givenName: "Ali" }],
        },
      },
    },
  });
  const snapshot = booking.bookingItems.trip.external;
  assert.equal(snapshot.orderId, "ord_1");
  assert.equal(snapshot.rawPayload, undefined);
  assert.equal(snapshot.apiToken, undefined);
});
