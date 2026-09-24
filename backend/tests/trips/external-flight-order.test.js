import assert from "node:assert/strict";
import test from "node:test";

import { buildExternalFlightPassengers } from "../../services/trips/providers/external-flight-passenger-mapper.js";
import {
  buildDuffelOrderRequest,
  createDuffelOrder,
  getDuffelOrder,
  normalizeDuffelOrder,
} from "../../services/trips/providers/duffel-order-service.js";
import { buildExternalFlightOrderInput } from "../../services/trips/external-flight-order-service.js";

const adultId = "64b000000000000000000001";
const travelers = [{
  _id: adultId,
  passengerCategory: "adult",
  givenName: "Ali",
  familyName: "Saleh",
  birthDate: "1990-01-02",
  gender: "male",
  email: "ali@example.com",
  phoneNumber: "+966500000001",
  passportNumber: "P123",
  passportExpiryDate: "2030-01-01",
  passportIssuingCountryCode: "SA",
}, {
  _id: "64b000000000000000000002",
  passengerCategory: "infant_without_seat",
  responsibleAdultTravelerId: adultId,
  givenName: "Sara",
  familyName: "Saleh",
  birthDate: "2025-01-02",
  gender: "female",
  email: "sara@example.com",
  phoneNumber: "+966500000002",
  passportNumber: "P124",
  passportExpiryDate: "2030-01-01",
  passportIssuingCountryCode: "SA",
}];
const providerPassengers = [
  { providerPassengerId: "pas_adult", category: "adult" },
  { providerPassengerId: "pas_infant", category: "infant_without_seat" },
];

test("passenger mapper matches categories and explicitly links infant to adult", () => {
  const result = buildExternalFlightPassengers({ travelers, providerPassengers });
  assert.equal(result[0].providerPassengerId, "pas_adult");
  assert.equal(result[0].infantPassengerId, "pas_infant");
  assert.equal(result[1].providerPassengerId, "pas_infant");
});

test("passenger mapper rejects count, category, DOB and contact gaps", () => {
  assert.throws(
    () => buildExternalFlightPassengers({ travelers: travelers.slice(0, 1), providerPassengers }),
    ({ code }) => code === "EXTERNAL_FLIGHT_PASSENGER_COUNT_MISMATCH",
  );
  assert.throws(
    () => buildExternalFlightPassengers({
      travelers: [{ ...travelers[0], passengerCategory: "child" }, travelers[1]],
      providerPassengers,
    }),
    ({ code }) => code === "EXTERNAL_FLIGHT_PASSENGER_CATEGORY_MISMATCH",
  );
  assert.throws(
    () => buildExternalFlightPassengers({
      travelers: [{ ...travelers[0], birthDate: null }, travelers[1]],
      providerPassengers,
    }),
    ({ code }) => code === "EXTERNAL_FLIGHT_PASSENGER_DOB_REQUIRED",
  );
  assert.throws(
    () => buildExternalFlightPassengers({
      travelers: [{ ...travelers[0], email: "" }, travelers[1]],
      providerPassengers,
    }),
    ({ code, field }) =>
      code === "EXTERNAL_FLIGHT_PASSENGER_CONTACT_REQUIRED" &&
      field === "travelers.0.email",
  );
});

test("passenger mapper rejects a birth date that conflicts with the offer category", () => {
  assert.throws(
    () => buildExternalFlightPassengers({
      travelers: [
        travelers[0],
        { ...travelers[1], birthDate: "2010-01-01" },
      ],
      providerPassengers,
      travelStartsAt: "2026-10-01T08:00:00.000Z",
    }),
    ({ code, field }) =>
      code === "EXTERNAL_FLIGHT_PASSENGER_TYPE_MISMATCH" &&
      field === "travelers.1.birthDate",
  );
});

test("supported passport identity is optional and is sent only when complete", () => {
  const missing = [{ ...travelers[0], passportNumber: "" }, travelers[1]];
  const withoutDocuments = buildExternalFlightPassengers({
    travelers: missing,
    providerPassengers,
    supportedIdentityDocumentTypes: ["passport"],
  });
  assert.deepEqual(withoutDocuments[0].identityDocuments, []);

  const withDocuments = buildExternalFlightPassengers({
    travelers,
    providerPassengers,
    supportedIdentityDocumentTypes: ["passport"],
  });
  assert.equal(withDocuments[0].identityDocuments[0].type, "passport");
  assert.equal(withDocuments[0].identityDocuments[0].uniqueIdentifier, "P123");
});

test("passport must remain valid through the end of the external flight", () => {
  assert.throws(
    () => buildExternalFlightPassengers({
      travelers,
      providerPassengers,
      supportedIdentityDocumentTypes: ["passport"],
      travelEndsAt: "2031-01-01T10:00:00Z",
    }),
    ({ code, field }) =>
      code === "EXTERNAL_FLIGHT_PASSPORT_EXPIRES_BEFORE_TRAVEL" &&
      field === "travelers.0.passportExpiryDate",
  );
});

test("Duffel v2 payload omits passenger type, images and hold payments", () => {
  const passengers = buildExternalFlightPassengers({ travelers, providerPassengers });
  const hold = buildDuffelOrderRequest({
    offer: { offerId: "off_1", pricing: { total: 1850, currency: "SAR" } },
    passengers,
    payment: { orderType: "hold" },
    metadata: { draftId: "draft-1", nested: { secret: true } },
  });

  assert.equal("payments" in hold.data, false);
  assert.equal("type" in hold.data.passengers[0], false);
  assert.equal(hold.data.passengers[0].title, "mr");
  assert.equal("passportImage" in hold.data.passengers[0], false);
  assert.equal("nested" in hold.data.metadata, false);
  assert.equal(hold.data.passengers[0].infant_passenger_id, "pas_infant");
});

test("local child title is mapped to a Duffel-supported title by gender", () => {
  const child = {
    ...travelers[0],
    passengerCategory: "child",
    title: "CHILD",
    gender: "female",
  };
  const result = buildExternalFlightPassengers({
    travelers: [child],
    providerPassengers: [{ providerPassengerId: "pas_child", category: "child" }],
  });
  assert.equal(result[0].title, "miss");
});

test("instant provider payment must equal the latest offer", () => {
  const passengers = buildExternalFlightPassengers({ travelers, providerPassengers });
  assert.throws(
    () => buildDuffelOrderRequest({
      offer: { offerId: "off_1", pricing: { total: 1850, currency: "SAR" } },
      passengers,
      payment: { orderType: "instant", type: "balance", amount: 1800, currency: "SAR" },
    }),
    ({ code }) => code === "EXTERNAL_FLIGHT_ORDER_PAYMENT_MISMATCH",
  );
});

test("202 create response normalizes to PENDING and never exposes raw order", async () => {
  let captured;
  const order = await createDuffelOrder({
    offer: { offerId: "off_1", pricing: { total: 1850, currency: "SAR" } },
    passengers: buildExternalFlightPassengers({ travelers, providerPassengers }),
    payment: { orderType: "instant", type: "balance", amount: 1850, currency: "SAR" },
  }, {
    client: {
      async request(path, options) {
        captured = { path, options };
        return {
          status: 202,
          payload: { data: { id: "ord_1", offer_id: "off_1", total_amount: "1850", total_currency: "SAR" } },
        };
      },
    },
  });

  assert.equal(captured.path, "/air/orders");
  assert.equal(captured.options.method, "POST");
  assert.equal(order.status, "PENDING");
  assert.equal(order.orderId, "ord_1");
  assert.equal("payload" in order, false);
});

test("GET order uses the shared client and normalizes confirmed result", async () => {
  let path;
  const result = await getDuffelOrder("ord_1", {
    client: { async request(value) { path = value; return { data: { id: "ord_1" } }; } },
  });
  assert.equal(path, "/air/orders/ord_1");
  assert.equal(result.status, "CONFIRMED");
});

test("order normalizer keeps only the historical provider-neutral allowlist", () => {
  const result = normalizeDuffelOrder({
    id: "ord_1",
    raw_secret: "no",
    passengers: [{ id: "pas_1", given_name: "Ali", family_name: "Saleh", passport_number: "no" }],
  });
  assert.equal(result.passengers[0].givenName, "Ali");
  assert.equal("passport_number" in result.passengers[0], false);
  assert.equal("raw_secret" in result, false);
});

test("domain order input trusts the snapshot offer id and latest provider price", async () => {
  const latestOffer = {
    offerId: "off_trusted",
    offerRequestId: "orq_1",
    expiresAt: "2030-01-01T00:00:00.000Z",
    origin: { code: "SAH" },
    destination: { code: "JED" },
    pricing: { total: 1850, currency: "SAR" },
    passengers: { count: 2, items: providerPassengers },
    slices: [{ id: "slice-1", origin: { code: "SAH" }, destination: { code: "JED" }, segmentIds: [] }],
    segments: [],
    paymentRequirements: { requiresInstantPayment: true, paymentRequiredBy: null },
  };
  const input = await buildExternalFlightOrderInput({
    draft: {
      travelers,
      trip: { external: {
        provider: "DUFFEL",
        offerId: "off_trusted",
        route: { origin: "SAH", destination: "JED" },
        pricing: { total: 1850, currency: "SAR" },
        passengers: { total: 2 },
      } },
    },
    payment: {
      orderType: "instant",
      type: "balance",
      amount: 1,
      currency: "USD",
    },
  }, {
    revalidation: {
      getOffer: async ({ offerId }) => {
        assert.equal(offerId, "off_trusted");
        return latestOffer;
      },
      now: () => new Date("2029-01-01T00:00:00.000Z"),
    },
  });

  assert.equal(input.offer.offerId, "off_trusted");
  assert.equal(input.payment.amount, 1850);
  assert.equal(input.payment.currency, "SAR");
});
