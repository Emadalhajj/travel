import test from "node:test";
import assert from "node:assert/strict";
import {
  createPublicExternalFlightDraft,
  searchPublicExternalFlights,
} from "../../services/trips/public-external-flight-service.js";
import {
  publicExternalFlightDraftSchema,
  publicExternalFlightSearchSchema,
} from "../../validations/trips/duffel-search-validation.js";
import { buildBookingPricingFromDraft } from "../../services/draft-bookings/draft-booking-service.js";
import { readFile } from "node:fs/promises";

const offer = {
  offerId: "off_public_1",
  offerRequestId: "orq_1",
  expiresAt: "2099-01-02T00:00:00.000Z",
  origin: { code: "JED" },
  destination: { code: "ADE" },
  pricing: { total: 850, currency: "SAR" },
  passengers: {
    count: 2,
    items: [
      { providerPassengerId: "pas_1", category: "adult" },
      { providerPassengerId: "pas_2", category: "child" },
    ],
  },
  slices: [{
    id: "slice_1",
    origin: { code: "JED" },
    destination: { code: "ADE" },
    segmentIds: ["seg_1"],
  }],
  segments: [{
    id: "seg_1",
    origin: { code: "JED" },
    destination: { code: "ADE" },
    departureAt: "2099-01-01T08:00:00.000Z",
    arrivalAt: "2099-01-01T10:00:00.000Z",
    marketingCarrier: { iataCode: "XY", name: "Example Air" },
    flightNumber: "101",
  }],
  supportedIdentityDocumentTypes: ["passport"],
  paymentRequirements: {},
};

test("public search forbids selecting a provider from the client", () => {
  const result = publicExternalFlightSearchSchema.validate({
    provider: "DUFFEL",
    origin: "JED",
    destination: "ADE",
    departureDate: "2099-01-01",
    adults: 1,
  });
  assert.ok(result.error);
});

test("public draft validation accepts only a safe offer reference and expectations", () => {
  const { error, value } = publicExternalFlightDraftSchema.validate({
    offerId: "off_public_1",
    expected: {
      route: { origin: "JED", destination: "ADE" },
      pricing: { total: 850, currency: "SAR" },
      passengers: { adults: 1, children: 1, infants: 0, total: 2 },
    },
  });
  assert.equal(error, undefined);
  assert.equal(value.offerId, "off_public_1");
});

test("public search delegates without persisting catalog entities", async () => {
  let received;
  const result = await searchPublicExternalFlights(
    { origin: "JED", destination: "ADE" },
    { duffel: { client: { request: async () => ({ data: { offers: [] } }) }, configFactory: () => ({ supplierTimeoutMs: 1000 }) } },
  );
  received = result;
  assert.deepEqual(received, []);
});

test("selection revalidates and creates a standalone SERVICE/FLIGHT draft", async () => {
  let created;
  const draft = await createPublicExternalFlightDraft({
    offerId: offer.offerId,
    userId: "user-1",
    expected: {
      route: { origin: "JED", destination: "ADE" },
      pricing: offer.pricing,
      passengers: { adults: 1, children: 1, infants: 0, total: 2 },
    },
  }, {
    getOffer: async () => offer,
    createDraft: async (data) => { created = data; return { _id: "draft-1", ...data }; },
  });

  assert.equal(draft.bookingContext, "SERVICE");
  assert.equal(draft.serviceType, "FLIGHT");
  assert.equal(draft.program, undefined);
  assert.equal(draft.trip.tripId, undefined);
  assert.equal(draft.trip.departureId, undefined);
  assert.equal(draft.trip.external.offerId, offer.offerId);
  assert.equal(created.travelers.length, 2);
  assert.equal(created.pricing.total, 850);
});

test("standalone flight pricing trusts provider total without adding package VAT", () => {
  const pricing = buildBookingPricingFromDraft({
    bookingContext: "SERVICE",
    serviceType: "FLIGHT",
    travelers: [{}, {}],
    trip: { external: { pricing: { total: 850, currency: "SAR" } } },
  });
  assert.equal(pricing.pricingSource, "EXTERNAL_FLIGHT");
  assert.equal(pricing.totalPrice, 850);
  assert.equal(pricing.taxAmount, 0);
});

test("public route keeps search public and protects draft creation", async () => {
  const source = await readFile(
    new URL("../../routes/trips/public-flight-route.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /"\/search",\s*publicFlightSearchRateLimiter/);
  assert.match(source, /"\/drafts",\s*protect,\s*draftCreationRateLimiter/);
  assert.doesNotMatch(source, /authorize\(/);
});
