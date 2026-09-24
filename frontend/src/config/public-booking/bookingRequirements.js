const field = ({
  visible = true,
  required = false,
  editable = true,
  systemManaged = false,
} = {}) => ({ visible, required, editable, systemManaged });

const section = ({
  visible = true,
  required = visible,
  fixedCount = false,
} = {}) => ({
  visible,
  required,
  fixedCount,
});

const document = (visible, required = false) => ({ visible, required });

const basicTravelerFields = ({
  passportNumber = false,
  nationality = false,
  birthDate = false,
  gender = false,
  whatsapp = false,
} = {}) => ({
  fullName: field({ required: true }),
  passportNumber: field({ visible: passportNumber, required: passportNumber }),
  nationality: field({ visible: nationality, required: nationality }),
  birthDate: field({ visible: birthDate, required: birthDate }),
  gender: field({ visible: gender, required: gender }),
  whatsapp: field({ visible: whatsapp }),
});

const accommodationRequirements = {
  customer: section(),
  travelers: section(),
  hosts: section({ visible: false, required: false }),
  travelerFields: basicTravelerFields({ nationality: true }),
  documents: {},
};

export const BOOKING_REQUIREMENTS = Object.freeze({
  UMRAH: {
    customer: section(),
    travelers: section(),
    hosts: section(),
    travelerFields: basicTravelerFields({
      passportNumber: true,
      nationality: true,
      birthDate: true,
      gender: true,
      whatsapp: true,
    }),
    documents: {
      passport: document(true, true),
      personalPhoto: document(true),
      vaccinationCertificate: document(true),
      visaAttachment: document(true),
    },
  },

  FLIGHT: {
    customer: section({ visible: false, required: false }),
    travelers: section({ fixedCount: true }),
    hosts: section({ visible: false, required: false }),
    travelerFields: {
      title: field({ required: true }),
      firstName: field({ required: true }),
      middleName: field(),
      lastName: field({ required: true }),
      nationality: field({ required: true }),
      birthDate: field({ required: true }),
      gender: field({ required: true }),
      email: field({ required: true }),
      phoneNumber: field({ required: true }),
      documentType: field({ required: true }),
      documentNumber: field({ required: true }),
      documentIssuingCountry: field(),
      passportExpiryDate: field({ required: true }),
      passengerType: field({
        visible: false,
        required: true,
        editable: false,
        systemManaged: true,
      }),
      responsibleAdultTravelerId: field({
        visible: false,
        required: false,
        editable: false,
        systemManaged: true,
      }),
    },
    documents: {
      travelDocument: document(true),
      personalPhoto: document(false),
      vaccinationCertificate: document(false),
      visaAttachment: document(false),
    },
  },

  TRIP: {
    customer: section(),
    travelers: section(),
    hosts: section({ visible: false, required: false }),
    travelerFields: basicTravelerFields({
      nationality: true,
      birthDate: true,
      gender: true,
      whatsapp: true,
    }),
    documents: {},
  },

  ACCOMMODATION: accommodationRequirements,
  HOTEL: accommodationRequirements,
  TRANSPORT: {
    customer: section(),
    travelers: section(),
    hosts: section({ visible: false, required: false }),
    travelerFields: basicTravelerFields(),
    documents: {},
  },
  VISA: {
    customer: section(),
    travelers: section(),
    hosts: section({ visible: false, required: false }),
    travelerFields: basicTravelerFields({
      passportNumber: true,
      nationality: true,
      birthDate: true,
      gender: true,
      whatsapp: true,
    }),
    documents: {
      passport: document(true, true),
      personalPhoto: document(true, true),
    },
  },
  ZIYARAT: {
    customer: section(),
    travelers: section(),
    hosts: section({ visible: false, required: false }),
    travelerFields: basicTravelerFields(),
    documents: {},
  },
  EXTRA_SERVICE: {
    customer: section(),
    travelers: section({ visible: false, required: false }),
    hosts: section({ visible: false, required: false }),
    travelerFields: {},
    documents: {},
  },
});

export const isRequirementVisible = (requirement) =>
  typeof requirement === "object"
    ? requirement?.visible !== false
    : Boolean(requirement);

export const isRequirementRequired = (requirement) =>
  typeof requirement === "object"
    ? Boolean(requirement?.required)
    : Boolean(requirement);

export function getBookingRequirementKey(draftBooking) {
  const packageType = String(
    draftBooking?.bookingContext ||
      draftBooking?.data?.packageType ||
      draftBooking?.data?.bookingMode ||
      "",
  ).toUpperCase();
  if (packageType === "READY_PACKAGE" || packageType === "CUSTOM_PACKAGE") {
    return "UMRAH";
  }
  if (packageType === "SERVICE") {
    return String(
      draftBooking?.serviceType || draftBooking?.data?.serviceType || "",
    ).toUpperCase();
  }
  return "UMRAH";
}

export function getBookingRequirements(draftBooking) {
  return (
    BOOKING_REQUIREMENTS[getBookingRequirementKey(draftBooking)] ||
    BOOKING_REQUIREMENTS.UMRAH
  );
}
