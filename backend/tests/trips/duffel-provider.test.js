import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { getDuffelConfig } from "../../config/duffel.js";
import { createDuffelClient } from "../../services/trips/providers/duffel-client.js";
import {
  buildDuffelOfferRequest,
  normalizeDuffelOffer,
  searchDuffelOffers,
} from "../../services/trips/providers/duffel-offer-service.js";
import { searchExternalFlightOffers } from "../../services/trips/providers/flight-provider-factory.js";
import { externalFlightSearchSchema } from "../../validations/trips/duffel-search-validation.js";

const config = {
  baseUrl: "https://api.duffel.test",
  accessToken: "test-token",
  apiVersion: "v2",
  supplierTimeoutMs: 15000,
  httpTimeoutMs: 20000,
};

const response = (status, payload, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => headers[name.toLowerCase()] || null },
  json: async () => payload,
});

const validSearch = {
  provider: "DUFFEL",
  origin: "JED",
  destination: "ADE",
  departureDate: "2099-09-10",
  returnDate: "2099-09-17",
  adults: 2,
  children: 1,
  infants: 1,
  cabinClass: "BUSINESS",
};

test("Duffel config rejects missing credentials and unsafe timeouts", () => {
  assert.throws(() => getDuffelConfig({}), (error) => error.message === "FLIGHT_PROVIDER_NOT_CONFIGURED");
  assert.throws(
    () => getDuffelConfig({ DUFFEL_ACCESS_TOKEN: "x", DUFFEL_SUPPLIER_TIMEOUT_MS: 20000, DUFFEL_HTTP_TIMEOUT_MS: 10000 }),
    (error) => error.message === "FLIGHT_PROVIDER_TIMEOUT_CONFIG_INVALID",
  );
});

test("flight search validation normalizes input and rejects invalid relationships", () => {
  const { value, error } = externalFlightSearchSchema.validate({
    ...validSearch,
    origin: "jed",
    destination: "ade",
  });
  assert.equal(error, undefined);
  assert.equal(value.origin, "JED");
  assert.equal(value.destination, "ADE");

  for (const invalid of [
    { ...validSearch, destination: "JED" },
    { ...validSearch, departureDate: "2020-01-01" },
    { ...validSearch, returnDate: "2099-09-01" },
    { ...validSearch, adults: 1, infants: 2 },
  ]) {
    assert.ok(externalFlightSearchSchema.validate(invalid).error);
  }
});

test("offer request mapper supports return journeys and passenger types", () => {
  const payload = buildDuffelOfferRequest(validSearch);
  assert.equal(payload.data.slices.length, 2);
  assert.equal(payload.data.cabin_class, "business");
  assert.deepEqual(payload.data.passengers.map(({ type }) => type), [
    "adult", "adult", "child", "infant_without_seat",
  ]);
});

test("Duffel client sends required headers and maps provider failures", async () => {
  let captured;
  const client = createDuffelClient({
    configFactory: () => config,
    fetchImpl: async (url, options) => {
      captured = { url: String(url), options };
      return response(200, { data: { offers: [] } });
    },
  });
  await client.request("/air/offer_requests", { method: "POST", body: { data: {} } });
  assert.equal(captured.options.headers.Authorization, "Bearer test-token");
  assert.equal(captured.options.headers["Duffel-Version"], "v2");
  assert.equal(captured.options.headers.Accept, "application/json");

  for (const [status, code] of [
    [401, "FLIGHT_PROVIDER_AUTH_ERROR"],
    [429, "FLIGHT_PROVIDER_RATE_LIMITED"],
    [422, "FLIGHT_SEARCH_INVALID"],
    [500, "FLIGHT_PROVIDER_UNAVAILABLE"],
  ]) {
    const failingClient = createDuffelClient({
      configFactory: () => config,
      fetchImpl: async () => response(status, { errors: [{ code: "provider_error" }] }),
    });
    await assert.rejects(
      failingClient.request("/air/offer_requests"),
      (error) => error.message === code,
    );
  }
});

test("Duffel client aborts requests that exceed the configured timeout", async () => {
  const client = createDuffelClient({
    configFactory: () => ({ ...config, httpTimeoutMs: 5 }),
    fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    }),
  });
  await assert.rejects(
    client.request("/air/offer_requests"),
    (error) => error.message === "FLIGHT_PROVIDER_TIMEOUT",
  );
});

test("offer normalizer preserves multi-segment operational and pricing data", () => {
  const normalized = normalizeDuffelOffer({
    id: "off_1",
    offer_request_id: "orq_1",
    expires_at: "2099-09-01T00:00:00Z",
    total_amount: "850.50",
    total_currency: "SAR",
    tax_amount: "50.25",
    cabin_class: "business",
    slices: [{
      id: "slice_1",
      duration: "PT4H",
      segments: [{
        id: "seg_1",
        origin: { iata_code: "JED", name: "Jeddah" },
        destination: { iata_code: "CAI", name: "Cairo" },
        departing_at: "2099-09-10T08:00:00",
        arriving_at: "2099-09-10T10:00:00",
        marketing_carrier: { name: "Carrier A", iata_code: "AA" },
        operating_carrier: { name: "Carrier B", iata_code: "BB" },
      }],
    }],
  });
  assert.equal(normalized.offerId, "off_1");
  assert.equal(normalized.segments[0].operatingCarrier.iataCode, "BB");
  assert.equal(normalized.pricing.total, 850.5);
  assert.equal(normalized.expiresAt, "2099-09-01T00:00:00Z");
});

test("search service returns an empty list and factory rejects unsupported providers", async () => {
  const offers = await searchDuffelOffers(validSearch, {
    configFactory: () => config,
    client: { request: async () => ({ data: { offers: [] } }) },
  });
  assert.deepEqual(offers, []);
  await assert.rejects(
    searchExternalFlightOffers({ ...validSearch, provider: "UNKNOWN" }),
    (error) => error.message === "FLIGHT_PROVIDER_UNSUPPORTED",
  );
});

test("admin provider route remains protected and validated", async () => {
  const source = await readFile(
    new URL("../../routes/trips/duffel-provider-route.js", import.meta.url),
    "utf8",
  );
  const order = [
    "protect,",
    'authorize("admin", "superAdmin"),',
    "flightSearchRateLimiter,",
    "validate(externalFlightSearchSchema),",
    "searchExternalFlights,",
  ].map((token) => source.indexOf(token));
  assert.ok(order.every((position) => position >= 0));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});
