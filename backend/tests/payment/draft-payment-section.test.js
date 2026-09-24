import test from "node:test";
import assert from "node:assert/strict";

import { PAYMENT_SECTION_CODES } from "../../constants/payments/payment-section-codes.js";
import { resolveDraftPaymentSectionCode } from "../../services/payment/initialize-public-payment-service.js";

test("standalone flight drafts resolve to FLIGHT_BOOKING", () => {
  assert.equal(
    resolveDraftPaymentSectionCode({
      bookingContext: "SERVICE",
      serviceType: "FLIGHT",
    }),
    PAYMENT_SECTION_CODES.FLIGHT_BOOKING,
  );
});

test("standalone land and sea trip drafts resolve to FLIGHT_BOOKING", () => {
  assert.equal(
    resolveDraftPaymentSectionCode({
      bookingContext: "SERVICE",
      serviceType: "TRIP",
    }),
    PAYMENT_SECTION_CODES.FLIGHT_BOOKING,
  );
});

test("ready and custom drafts resolve to their configured payment sections", () => {
  assert.equal(
    resolveDraftPaymentSectionCode({ bookingContext: "READY_PACKAGE" }),
    PAYMENT_SECTION_CODES.PROGRAM_BOOKING,
  );
  assert.equal(
    resolveDraftPaymentSectionCode({ bookingContext: "CUSTOM_PACKAGE" }),
    PAYMENT_SECTION_CODES.CUSTOM_PACKAGE,
  );
});

test("standalone services use dedicated payment sections", () => {
  const expected = {
    ACCOMMODATION: PAYMENT_SECTION_CODES.HOTEL_BOOKING,
    HOTEL: PAYMENT_SECTION_CODES.HOTEL_BOOKING,
    VISA: PAYMENT_SECTION_CODES.VISA_BOOKING,
    TRANSPORT: PAYMENT_SECTION_CODES.TRANSPORT_BOOKING,
    ZIYARAT: PAYMENT_SECTION_CODES.ZIYARAT_BOOKING,
    EXTRA_SERVICE: PAYMENT_SECTION_CODES.EXTRA_SERVICE_BOOKING,
  };
  for (const [serviceType, section] of Object.entries(expected)) {
    assert.equal(
      resolveDraftPaymentSectionCode({ bookingContext: "SERVICE", serviceType }),
      section,
    );
  }
});
