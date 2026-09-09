import assert from "node:assert/strict";
import test from "node:test";

import TripDeparture from "../../models/transportition/trip-departure-model.js";
import AuditLog from "../../models/audit/audit-log-model.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";
import { createAuditLog } from "../../services/audit/audit-log-service.js";
import { importExternalFlightOffer } from "../../services/trips/external-flight-import-service.js";

const offer = {
  provider: "DUFFEL",
  offerId: "off_1",
  offerRequestId: "orq_1",
  expiresAt: "2099-10-10T00:00:00Z",
  cabinClass: "ECONOMY",
  pricing: { total: 2000, currency: "SAR" },
  slices: [
    { id: "slice_out", origin: { code: "JED", countryCode: "SA" }, destination: { code: "ADE", countryCode: "YE" }, segmentIds: ["seg_out"] },
    { id: "slice_in", origin: { code: "ADE", countryCode: "YE" }, destination: { code: "JED", countryCode: "SA" }, segmentIds: ["seg_in"] },
  ],
  segments: [
    { id: "seg_out", origin: { code: "JED" }, destination: { code: "ADE" }, departureAt: "2099-10-10T08:00:00Z", arrivalAt: "2099-10-10T11:00:00Z", flightNumber: "101", marketingCarrier: { name: "Test Air", iataCode: "TA" }, operatingCarrier: { name: "Test Air", iataCode: "TA" } },
    { id: "seg_in", origin: { code: "ADE" }, destination: { code: "JED" }, departureAt: "2099-10-17T08:00:00Z", arrivalAt: "2099-10-17T11:00:00Z", flightNumber: "102", marketingCarrier: { name: "Test Air", iataCode: "TA" }, operatingCarrier: { name: "Test Air", iataCode: "TA" } },
  ],
};

const createSession = () => {
  const state = { ended: false, transactions: 0 };
  return {
    state,
    withTransaction: async (work) => {
      state.transactions += 1;
      return work();
    },
    endSession: async () => { state.ended = true; },
  };
};

test("imports round-trip slices atomically without duplicating the offer total", async () => {
  const session = createSession();
  const tripInputs = [];
  const departureInputs = [];
  const result = await importExternalFlightOffer(
    { provider: "DUFFEL", offerId: "off_1", userId: "user_1" },
    {
      getOffer: async () => offer,
      startSession: async () => session,
      findDeparture: async () => null,
      findTrip: async () => null,
      createTrip: async (input) => {
        tripInputs.push(input);
        return { _id: `trip_${tripInputs.length}` };
      },
      createDeparture: async (input) => {
        departureInputs.push(input);
        return { _id: `departure_${departureInputs.length}`, tripId: input.data.tripId };
      },
    },
  );

  assert.equal(session.state.transactions, 1);
  assert.equal(session.state.ended, true);
  assert.equal(result.items.length, 2);
  assert.deepEqual(departureInputs.map(({ data }) => data.externalId), ["slice_out", "slice_in"]);
  assert.deepEqual(departureInputs.map(({ data }) => data.pricing.basePrice), [0, 0]);
  assert.deepEqual(departureInputs.map(({ data }) => data.providerSnapshot.total), [2000, 2000]);
  assert.ok(tripInputs.every(({ session: supplied }) => supplied === session));
  assert.ok(departureInputs.every(({ session: supplied }) => supplied === session));
});

test("returns existing departures for repeated imports without creating records", async () => {
  const session = createSession();
  const existing = {
    slice_out: { _id: "departure_out", tripId: "trip_out" },
    slice_in: { _id: "departure_in", tripId: "trip_in" },
  };
  let creates = 0;
  const result = await importExternalFlightOffer(
    { provider: "DUFFEL", offerId: "off_1" },
    {
      getOffer: async () => offer,
      startSession: async () => session,
      findDeparture: async ({ externalId }) => existing[externalId],
      createTrip: async () => { creates += 1; },
      createDeparture: async () => { creates += 1; },
    },
  );
  assert.equal(creates, 0);
  assert.ok(result.items.every(({ reused }) => reused));
});

test("propagates worker failures and always closes the transaction session", async () => {
  const session = createSession();
  await assert.rejects(importExternalFlightOffer(
    { provider: "DUFFEL", offerId: "off_1" },
    {
      getOffer: async () => offer,
      startSession: async () => session,
      findDeparture: async () => null,
      findTrip: async () => null,
      createTrip: async () => ({ _id: "trip_1" }),
      createDeparture: async () => { throw new Error("write failed"); },
    },
  ), /write failed/);
  assert.equal(session.state.ended, true);
});

test("resolves a concurrent unique-key import as an idempotent success", async () => {
  const session = createSession();
  const duplicate = Object.assign(new Error("duplicate"), { code: 11000 });
  const existing = {
    slice_out: { _id: "departure_out", tripId: "trip_out" },
    slice_in: { _id: "departure_in", tripId: "trip_in" },
  };
  const result = await importExternalFlightOffer(
    { provider: "DUFFEL", offerId: "off_1" },
    {
      getOffer: async () => offer,
      startSession: async () => session,
      findDeparture: async ({ externalId }, activeSession) => activeSession ? null : existing[externalId],
      findTrip: async () => null,
      createTrip: async () => ({ _id: "trip_new" }),
      createDeparture: async () => { throw duplicate; },
    },
  );
  assert.ok(result.items.every(({ reused }) => reused));
});

test("keeps a partial unique provider identity index", () => {
  const index = TripDeparture.schema.indexes().find(([fields]) =>
    fields.providerId === 1 && fields.externalId === 1);
  assert.ok(index);
  assert.equal(index[1].unique, true);
  assert.equal(index[1].partialFilterExpression.source, "API");
});

test("creates audit records inside the supplied transaction session", async () => {
  const originalCreate = AuditLog.create;
  const session = { id: "session_1" };
  let captured;
  AuditLog.create = async (documents, options) => {
    captured = { documents, options };
    return documents;
  };
  try {
    await createAuditLog({
      action: AUDIT_ACTIONS.CREATE,
      entity: AUDIT_ENTITIES.TRIP,
      entityId: "507f1f77bcf86cd799439011",
      session,
    });
    assert.ok(Array.isArray(captured.documents));
    assert.equal(captured.options.session, session);
  } finally {
    AuditLog.create = originalCreate;
  }
});
