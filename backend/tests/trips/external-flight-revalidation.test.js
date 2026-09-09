import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExternalFlightSnapshot,
  revalidateExternalFlightOffer,
} from "../../services/trips/external-flight-revalidation-service.js";

const offer = {
  offerId: "off-1",
  offerRequestId: "orq-1",
  expiresAt: "2030-01-01T00:00:00.000Z",
  origin: { code: "SAH" },
  destination: { code: "JED" },
  pricing: { total: 1850, currency: "SAR" },
  passengers: {
    count: 2,
    items: [{ type: "adult" }, { type: "child" }],
  },
  segments: [{
    id: "seg-1",
    origin: { code: "SAH" },
    destination: { code: "JED" },
    departureAt: "2029-12-01T08:00:00.000Z",
    arrivalAt: "2029-12-01T10:00:00.000Z",
    flightNumber: "101",
    marketingCarrier: { iataCode: "XY", name: "Carrier" },
  }],
  slices: [{
    id: "slice-1",
    origin: { code: "SAH" },
    destination: { code: "JED" },
    segmentIds: ["seg-1"],
  }],
};

const expected = {
  pricing: { total: 1850, currency: "SAR" },
  route: { origin: "SAH", destination: "JED" },
  passengers: { total: 2 },
};

test("revalidation returns a provider-neutral result for an unchanged offer", async () => {
  const result = await revalidateExternalFlightOffer({
    provider: "DUFFEL",
    offerId: offer.offerId,
    expected,
  }, {
    getOffer: async () => structuredClone(offer),
    now: () => new Date("2029-01-01T00:00:00.000Z"),
  });

  assert.equal(result.valid, true);
  assert.equal(result.changed, false);
  assert.deepEqual(result.comparison, {
    priceChanged: false,
    currencyChanged: false,
    routeChanged: false,
    passengerCountChanged: false,
  });
});

test("revalidation blocks a changed price and exposes old/new values", async () => {
  await assert.rejects(
    () => revalidateExternalFlightOffer({
      provider: "DUFFEL",
      offerId: offer.offerId,
      expected,
    }, {
      getOffer: async () => ({
        ...structuredClone(offer),
        pricing: { total: 1975, currency: "SAR" },
      }),
      now: () => new Date("2029-01-01T00:00:00.000Z"),
    }),
    ({ code, field, params }) =>
      code === "EXTERNAL_FLIGHT_PRICE_CHANGED" &&
      field === "trip.external.pricing" &&
      params.current.total === 1975,
  );
});

test("revalidation blocks expired and unavailable offers", async () => {
  await assert.rejects(
    () => revalidateExternalFlightOffer({
      provider: "DUFFEL",
      offerId: offer.offerId,
      expected,
    }, {
      getOffer: async () => ({ ...structuredClone(offer), expiresAt: "2028-01-01" }),
      now: () => new Date("2029-01-01T00:00:00.000Z"),
    }),
    ({ code }) => code === "EXTERNAL_FLIGHT_OFFER_EXPIRED",
  );

  await assert.rejects(
    () => revalidateExternalFlightOffer({
      provider: "DUFFEL",
      offerId: offer.offerId,
      expected,
    }, { getOffer: async () => { throw new Error("not found"); } }),
    ({ code }) => code === "EXTERNAL_FLIGHT_UNAVAILABLE",
  );
});

test("external snapshot contains normalized contract without raw provider payload", () => {
  const snapshot = buildExternalFlightSnapshot({ provider: "duffel", offer });

  assert.equal(snapshot.provider, "DUFFEL");
  assert.equal(snapshot.pricing.total, 1850);
  assert.equal(snapshot.passengers.total, 2);
  assert.equal(snapshot.slices[0].segments[0].externalId, "seg-1");
  assert.equal("raw" in snapshot, false);
});
