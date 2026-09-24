import {
  calculateAgeOnDate,
  getPassengerTypeByAge,
  validatePassengerAge,
} from "./passengerAge";

test("calculates completed years on the travel date", () => {
  expect(calculateAgeOnDate("2014-09-15", "2026-09-14")).toBe(11);
  expect(calculateAgeOnDate("2014-09-14", "2026-09-14")).toBe(12);
});

test("classifies infant, child and adult at exact boundaries", () => {
  expect(getPassengerTypeByAge({ birthDate: "2024-09-15", travelDate: "2026-09-14" }))
    .toBe("infant_without_seat");
  expect(getPassengerTypeByAge({ birthDate: "2024-09-14", travelDate: "2026-09-14" }))
    .toBe("child");
  expect(getPassengerTypeByAge({ birthDate: "2014-09-14", travelDate: "2026-09-14" }))
    .toBe("adult");
});

test("validates without changing the provider passenger type", () => {
  expect(validatePassengerAge({
    passengerType: "child",
    birthDate: "2010-01-01",
    travelDate: "2026-10-01",
  })).toMatchObject({
    valid: false,
    expectedType: "child",
    calculatedType: "adult",
  });
});
