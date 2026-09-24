import {
  PAYMENT_SECTION_CODES,
  resolvePaymentSectionCode,
  resolveAuthoritativePricingTotal,
} from "./paymentConfigurationConstants";

describe("resolvePaymentSectionCode", () => {
  test("is safe while the draft is still loading", () => {
    expect(resolvePaymentSectionCode(null)).toBe(
      PAYMENT_SECTION_CODES.CUSTOM_PACKAGE,
    );
  });

  test("uses the flight section for standalone external flight drafts", () => {
    expect(
      resolvePaymentSectionCode({
        bookingContext: "SERVICE",
        serviceType: "FLIGHT",
      }),
    ).toBe(PAYMENT_SECTION_CODES.FLIGHT_BOOKING);
  });

  test("uses the trips payment section for standalone land and sea trips", () => {
    expect(
      resolvePaymentSectionCode({
        bookingContext: "SERVICE",
        serviceType: "TRIP",
      }),
    ).toBe(PAYMENT_SECTION_CODES.FLIGHT_BOOKING);
  });

  test("uses the program section for ready packages", () => {
    expect(resolvePaymentSectionCode({ bookingContext: "READY_PACKAGE" })).toBe(
      PAYMENT_SECTION_CODES.PROGRAM_BOOKING,
    );
  });

  test.each([
    ["HOTEL", PAYMENT_SECTION_CODES.HOTEL_BOOKING],
    ["ACCOMMODATION", PAYMENT_SECTION_CODES.HOTEL_BOOKING],
    ["VISA", PAYMENT_SECTION_CODES.VISA_BOOKING],
    ["TRANSPORT", PAYMENT_SECTION_CODES.TRANSPORT_BOOKING],
    ["ZIYARAT", PAYMENT_SECTION_CODES.ZIYARAT_BOOKING],
    ["EXTRA_SERVICE", PAYMENT_SECTION_CODES.EXTRA_SERVICE_BOOKING],
  ])("uses the dedicated section for %s services", (serviceType, section) => {
    expect(resolvePaymentSectionCode({ bookingContext: "SERVICE", serviceType })).toBe(section);
  });

  test("keeps custom drafts on the custom-package section", () => {
    expect(resolvePaymentSectionCode({ bookingContext: "CUSTOM_PACKAGE" })).toBe(
      PAYMENT_SECTION_CODES.CUSTOM_PACKAGE,
    );
  });
});

describe("resolveAuthoritativePricingTotal", () => {
  test("prefers Pricing V2 total over a zero legacy mirror", () => {
    expect(resolveAuthoritativePricingTotal({ total: 3465, totalPrice: 0 })).toBe(3465);
  });

  test("falls back to the legacy total for legacy drafts", () => {
    expect(resolveAuthoritativePricingTotal({ totalPrice: 950 })).toBe(950);
  });
});
