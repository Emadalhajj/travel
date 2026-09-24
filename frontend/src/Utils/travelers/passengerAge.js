export const PASSENGER_TYPES = Object.freeze({
  INFANT: "infant_without_seat",
  CHILD: "child",
  ADULT: "adult",
});

const parseDateOnly = (value) => {
  const match = String(value || "").slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() === Number(match[2]) - 1 &&
    date.getUTCDate() === Number(match[3])
    ? date
    : null;
};

export const calculateAgeOnDate = (birthDate, travelDate) => {
  const birth = parseDateOnly(birthDate);
  const travel = parseDateOnly(travelDate);
  if (!birth || !travel || birth > travel) return null;

  let age = travel.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayOccurred = travel.getUTCMonth() > birth.getUTCMonth() ||
    (travel.getUTCMonth() === birth.getUTCMonth() &&
      travel.getUTCDate() >= birth.getUTCDate());
  if (!birthdayOccurred) age -= 1;
  return age;
};

export const getPassengerTypeByAge = ({ birthDate, travelDate }) => {
  const age = calculateAgeOnDate(birthDate, travelDate);
  if (age === null) return null;
  if (age < 2) return PASSENGER_TYPES.INFANT;
  if (age < 12) return PASSENGER_TYPES.CHILD;
  return PASSENGER_TYPES.ADULT;
};

export const validatePassengerAge = ({ passengerType, birthDate, travelDate }) => {
  const expectedType = String(passengerType || "").toLowerCase();
  const calculatedType = getPassengerTypeByAge({ birthDate, travelDate });
  if (!calculatedType) return { valid: false, reason: "INVALID_BIRTH_DATE" };
  if (calculatedType !== expectedType) {
    return {
      valid: false,
      reason: "PASSENGER_TYPE_MISMATCH",
      expectedType,
      calculatedType,
    };
  }
  return { valid: true, age: calculateAgeOnDate(birthDate, travelDate) };
};
