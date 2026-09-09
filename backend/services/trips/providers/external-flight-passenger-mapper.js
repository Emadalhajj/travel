import AppError from "../../../utils/AppError.js";

const normalize = (value) => String(value || "").trim();
const normalizeCategory = (value) => normalize(value).toLowerCase();
const travelerId = (traveler) => normalize(traveler?._id || traveler?.id);

const requireValue = (value, code, field, params = {}) => {
  const normalized = normalize(value);
  if (!normalized) throw new AppError(code, 400, field, params);
  return normalized;
};

const toDateOnly = (
  value,
  field,
  code = "EXTERNAL_FLIGHT_PASSENGER_DOB_REQUIRED",
) => {
  if (!value) throw new AppError(code, 400, field);
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(code, 400, field);
  }
  return date.toISOString().slice(0, 10);
};

const buildIdentityDocuments = ({ traveler, requiredTypes, index }) => {
  if (!requiredTypes.includes("passport")) return [];

  return [{
    type: "passport",
    uniqueIdentifier: requireValue(
      traveler.passportNumber,
      "EXTERNAL_FLIGHT_PASSENGER_DOCUMENT_REQUIRED",
      `travelers.${index}.passportNumber`,
    ),
    issuingCountryCode: requireValue(
      traveler.passportIssuingCountryCode,
      "EXTERNAL_FLIGHT_PASSENGER_DOCUMENT_REQUIRED",
      `travelers.${index}.passportIssuingCountryCode`,
    ).toUpperCase(),
    expiresOn: toDateOnly(
      traveler.passportExpiryDate,
      `travelers.${index}.passportExpiryDate`,
      "EXTERNAL_FLIGHT_PASSENGER_DOCUMENT_REQUIRED",
    ),
  }];
};

export const buildExternalFlightPassengers = ({
  travelers = [],
  providerPassengers = [],
  requiredIdentityDocumentTypes = [],
}) => {
  if (travelers.length !== providerPassengers.length) {
    throw new AppError("EXTERNAL_FLIGHT_PASSENGER_COUNT_MISMATCH", 400, "travelers");
  }

  const availableByCategory = new Map();
  providerPassengers.forEach((passenger) => {
    const category = normalizeCategory(passenger.category);
    const queue = availableByCategory.get(category) || [];
    queue.push(passenger);
    availableByCategory.set(category, queue);
  });

  const requiredTypes = requiredIdentityDocumentTypes
    .map(normalizeCategory);
  const mapped = travelers.map((traveler, index) => {
    const category = normalizeCategory(traveler.passengerCategory || "adult");
    const providerPassenger = availableByCategory.get(category)?.shift();
    if (!providerPassenger?.providerPassengerId) {
      throw new AppError("EXTERNAL_FLIGHT_PASSENGER_CATEGORY_MISMATCH", 400,
        `travelers.${index}.passengerCategory`);
    }

    const gender = traveler.gender === "female" ? "f" :
      traveler.gender === "male" ? "m" : "";
    if (!gender) {
      throw new AppError("EXTERNAL_FLIGHT_PASSENGER_GENDER_REQUIRED", 400,
        `travelers.${index}.gender`);
    }

    return {
      localTravelerId: travelerId(traveler),
      providerPassengerId: providerPassenger.providerPassengerId,
      category,
      givenName: requireValue(
        traveler.givenName,
        "EXTERNAL_FLIGHT_PASSENGER_NAME_REQUIRED",
        `travelers.${index}.givenName`,
      ),
      familyName: requireValue(
        traveler.familyName,
        "EXTERNAL_FLIGHT_PASSENGER_NAME_REQUIRED",
        `travelers.${index}.familyName`,
      ),
      bornOn: toDateOnly(traveler.birthDate, `travelers.${index}.birthDate`),
      gender,
      email: requireValue(
        traveler.email,
        "EXTERNAL_FLIGHT_PASSENGER_CONTACT_REQUIRED",
        `travelers.${index}.email`,
      ),
      phoneNumber: requireValue(
        traveler.phoneNumber,
        "EXTERNAL_FLIGHT_PASSENGER_CONTACT_REQUIRED",
        `travelers.${index}.phoneNumber`,
      ),
      identityDocuments: buildIdentityDocuments({ traveler, requiredTypes, index }),
      responsibleAdultTravelerId: normalize(traveler.responsibleAdultTravelerId),
      infantPassengerId: "",
    };
  });

  const adultsByLocalId = new Map(
    mapped.filter(({ category, localTravelerId }) =>
      category === "adult" && localTravelerId)
      .map((passenger) => [passenger.localTravelerId, passenger]),
  );
  for (const infant of mapped.filter(({ category }) =>
    category === "infant_without_seat")) {
    const adult = adultsByLocalId.get(infant.responsibleAdultTravelerId);
    if (!adult || adult.infantPassengerId) {
      throw new AppError("EXTERNAL_FLIGHT_INFANT_ADULT_INVALID", 400,
        "travelers.responsibleAdultTravelerId");
    }
    adult.infantPassengerId = infant.providerPassengerId;
  }

  return mapped;
};
