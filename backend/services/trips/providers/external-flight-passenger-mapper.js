import AppError from "../../../utils/AppError.js";

const normalize = (value) => String(value || "").trim();
const normalizeCategory = (value) => normalize(value).toLowerCase();
const travelerId = (traveler) => normalize(traveler?._id || traveler?.id);

const requireName = (value, field) => {
  const normalized = normalize(value);
  if (!normalized) {
    throw new AppError("EXTERNAL_FLIGHT_PASSENGER_NAME_REQUIRED", 400, field);
  }
  return normalized;
};

const requireContact = (value, field) => {
  const normalized = normalize(value);
  if (!normalized) {
    throw new AppError("EXTERNAL_FLIGHT_PASSENGER_CONTACT_REQUIRED", 400, field);
  }
  return normalized;
};

const requireDocument = (value, field) => {
  const normalized = normalize(value);
  if (!normalized) {
    throw new AppError("EXTERNAL_FLIGHT_PASSENGER_DOCUMENT_REQUIRED", 400, field);
  }
  return normalized;
};

const toDateOnly = (value, field) => {
  if (!value) {
    throw new AppError("EXTERNAL_FLIGHT_PASSENGER_DOB_REQUIRED", 400, field);
  }
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("EXTERNAL_FLIGHT_PASSENGER_DOB_REQUIRED", 400, field);
  }
  return date.toISOString().slice(0, 10);
};

const toDocumentDateOnly = (value, field) => {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    throw new AppError("EXTERNAL_FLIGHT_PASSENGER_DOCUMENT_REQUIRED", 400, field);
  }
  return new Date(value).toISOString().slice(0, 10);
};

const buildIdentityDocuments = ({ traveler, requiredTypes, index }) => {
  if (!requiredTypes.includes("passport")) return [];

  return [{
    type: "passport",
    uniqueIdentifier: requireDocument(
      traveler.passportNumber,
      `travelers.${index}.passportNumber`,
    ),
    issuingCountryCode: requireDocument(
      traveler.passportIssuingCountryCode,
      `travelers.${index}.passportIssuingCountryCode`,
    ).toUpperCase(),
    expiresOn: toDocumentDateOnly(
      traveler.passportExpiryDate,
      `travelers.${index}.passportExpiryDate`,
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
      givenName: requireName(
        traveler.givenName,
        `travelers.${index}.givenName`,
      ),
      familyName: requireName(
        traveler.familyName,
        `travelers.${index}.familyName`,
      ),
      bornOn: toDateOnly(traveler.birthDate, `travelers.${index}.birthDate`),
      gender,
      email: requireContact(
        traveler.email,
        `travelers.${index}.email`,
      ),
      phoneNumber: requireContact(
        traveler.phoneNumber,
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
