import { validateBookingParty } from "./publicBookingValidation";
import {
  BOOKING_REQUIREMENTS,
  getBookingRequirementKey,
  getBookingRequirements,
  isRequirementVisible,
} from "../config/public-booking/bookingRequirements";

const customer = {
  name: "Customer",
  phone: "+966500000000",
  email: "customer@example.com",
  nationality: "SA",
};

test("basic standalone services do not require Umrah documents or hosts", () => {
  expect(
    validateBookingParty({
      customer,
      travelers: [{ fullName: "Guest" }],
      hosts: [],
      partyMode: "BASIC",
    }),
  ).toEqual({});
});

test("flight validation requires provider passenger identity fields", () => {
  const errors = validateBookingParty({
    customer,
    travelers: [{ fullName: "Traveler", passengerCategory: "adult" }],
    partyMode: "FLIGHT",
  });

  expect(errors["travelers.0.firstName"]).toBeTruthy();
  expect(errors["travelers.0.passportFiles"]).toBeFalsy();
});

test("top-level service fields select the canonical booking requirements", () => {
  const draft = {
    bookingContext: "SERVICE",
    serviceType: "EXTRA_SERVICE",
    data: { packageType: "CUSTOM_PACKAGE" },
  };

  expect(getBookingRequirementKey(draft)).toBe("EXTRA_SERVICE");
  expect(isRequirementVisible(getBookingRequirements(draft).travelers)).toBe(false);
});

test("extra services do not require a traveler", () => {
  expect(validateBookingParty({
    customer,
    travelers: [],
    requirements: getBookingRequirements({
      bookingContext: "SERVICE",
      serviceType: "EXTRA_SERVICE",
    }),
  })).toEqual({});
});

test("accommodation uses the same non-Umrah requirements for canonical and legacy types", () => {
  const canonical = getBookingRequirements({
    bookingContext: "SERVICE",
    serviceType: "ACCOMMODATION",
  });
  const legacy = getBookingRequirements({
    bookingContext: "SERVICE",
    serviceType: "HOTEL",
  });

  expect(canonical).toBe(legacy);
  expect(isRequirementVisible(canonical.hosts)).toBe(false);
  expect(canonical.documents.passport).toBeUndefined();
  expect(canonical.documents.vaccinationCertificate).toBeUndefined();
});

test("flight requirements hide customer and lock the provider passenger count", () => {
  expect(isRequirementVisible(BOOKING_REQUIREMENTS.FLIGHT.customer)).toBe(false);
  expect(BOOKING_REQUIREMENTS.FLIGHT.travelers.fixedCount).toBe(true);
  expect(isRequirementVisible(
    BOOKING_REQUIREMENTS.FLIGHT.travelerFields.passengerType,
  )).toBe(false);
  expect(BOOKING_REQUIREMENTS.FLIGHT.documents.travelDocument.required).toBe(false);
});

test("flight passport must remain valid through the end of travel", () => {
  const errors = validateBookingParty({
    customer,
    travelers: [{
      fullName: "Traveler",
      givenName: "Ali",
      familyName: "Saleh",
      passportNumber: "P123",
      nationality: "SA",
      birthDate: "1990-01-01",
      gender: "male",
      email: "ali@example.com",
      phoneNumber: "+966500000000",
      passengerCategory: "adult",
      passportExpiryDate: "2026-09-01",
      passportIssuingCountryCode: "SA",
    }],
    partyMode: "FLIGHT",
    travelEndsAt: "2026-09-20T12:00:00Z",
  });

  expect(errors["travelers.0.passportExpiryDate"]).toBeTruthy();
});
