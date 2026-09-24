import AppError from "../../../utils/AppError.js";
import { validatePassengerAge } from "../../../utils/passengers/passenger-age.js";

const normalize = (value) => String(value || "").trim();
const normalizeCategory = (value) => normalize(value).toLowerCase();
const travelerId = (traveler) => normalize(traveler?._id || traveler?.id);

const resolveProviderTitle = ({ traveler, gender }) => {
  const title = normalize(traveler.title).toUpperCase();
  const supportedTitles = {
    MR: "mr",
    MRS: "mrs",
    MS: "ms",
  };
  if (supportedTitles[title]) return supportedTitles[title];

  // CHILD/OTHER are local UI values and are not valid Duffel titles.
  return gender === "f" ? "miss" : "mr";
};

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

const buildIdentityDocuments = ({
  traveler,
  supportedTypes,
  index,
  travelEndsAt,
}) => {
  if (
    !supportedTypes.includes("passport") ||
    String(traveler.documentType || "PASSPORT").toUpperCase() !== "PASSPORT"
  ) return [];

  const documentNumber = normalize(
    traveler.documentNumber || traveler.passportNumber,
  );
  const issuingCountryCode = normalize(
    traveler.documentIssuingCountry || traveler.passportIssuingCountryCode,
  ).toUpperCase();
  const expiryDate = new Date(traveler.passportExpiryDate || 0);

  // Supported identity documents are optional. Send one only when complete.
  if (
    !documentNumber ||
    !issuingCountryCode ||
    Number.isNaN(expiryDate.getTime())
  ) return [];

  const expiresOn = expiryDate.toISOString().slice(0, 10);
  if (
    travelEndsAt &&
    new Date(expiresOn) < new Date(travelEndsAt)
  ) {
    throw new AppError(
      "EXTERNAL_FLIGHT_PASSPORT_EXPIRES_BEFORE_TRAVEL",
      400,
      `travelers.${index}.passportExpiryDate`,
    );
  }

  return [{
    type: "passport",
    uniqueIdentifier: documentNumber,
    issuingCountryCode,
    expiresOn,
  }];
};

export const buildExternalFlightPassengers = ({
  travelers = [],
  providerPassengers = [],
  supportedIdentityDocumentTypes = [],
  requiredIdentityDocumentTypes,
  travelStartsAt = null,
  travelEndsAt = null,
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

  const supportedTypes = (
    supportedIdentityDocumentTypes.length
      ? supportedIdentityDocumentTypes
      : requiredIdentityDocumentTypes || []
  )
    .map(normalizeCategory);
  const mapped = travelers.map((traveler, index) => {
    const category = normalizeCategory(traveler.passengerCategory || "adult");
    if (travelStartsAt) {
      const ageValidation = validatePassengerAge({
        passengerType: category,
        birthDate: traveler.birthDate,
        travelDate: travelStartsAt,
      });
      if (ageValidation.reason === "PASSENGER_TYPE_MISMATCH") {
        throw new AppError(
          "EXTERNAL_FLIGHT_PASSENGER_TYPE_MISMATCH",
          400,
          `travelers.${index}.birthDate`,
          {
            expectedType: ageValidation.expectedType || category,
            calculatedType: ageValidation.calculatedType || "",
          },
        );
      }
    }
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
        traveler.firstName || traveler.givenName,
        `travelers.${index}.givenName`,
      ),
      familyName: requireName(
        traveler.lastName || traveler.familyName,
        `travelers.${index}.familyName`,
      ),
      bornOn: toDateOnly(traveler.birthDate, `travelers.${index}.birthDate`),
      gender,
      title: resolveProviderTitle({ traveler, gender }),
      email: requireContact(
        traveler.email,
        `travelers.${index}.email`,
      ),
      phoneNumber: requireContact(
        traveler.phoneNumber,
        `travelers.${index}.phoneNumber`,
      ),
      identityDocuments: buildIdentityDocuments({
        traveler,
        supportedTypes,
        index,
        travelEndsAt,
      }),
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
