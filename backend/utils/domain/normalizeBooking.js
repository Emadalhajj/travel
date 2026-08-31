import { normalizeString }
from "../generic/normalizeString.js";

import { normalizeArray }
from "../generic/normalizeArray.js";
import { normalizeBoolean } from "../generic/normalizeBoolean.js";

// =============================
// Helpers
// =============================
const normalizeNumber = (value, defaultValue = 0) => {
  const numberValue = Number(value);

  return Number.isNaN(numberValue)
    ? defaultValue
    : numberValue;
};

const normalizeDate = (value) => {
  if (!value) return undefined;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? undefined
    : date;
};


// =============================
// Pilgrim
// =============================

export const normalizePilgrim = (
  pilgrim = {},
) => ({
  passportNumber:
    normalizeString(
      pilgrim.passportNumber,
    ),

  firstNameAr:
    normalizeString(
      pilgrim.firstNameAr,
    ),

  secondNameAr:
    normalizeString(
      pilgrim.secondNameAr,
    ),

  thirdNameAr:
    normalizeString(
      pilgrim.thirdNameAr,
    ),

  lastNameAr:
    normalizeString(
      pilgrim.lastNameAr,
    ),

  firstNameEn:
    normalizeString(
      pilgrim.firstNameEn,
    ),

  secondNameEn:
    normalizeString(
      pilgrim.secondNameEn,
    ),

  thirdNameEn:
    normalizeString(
      pilgrim.thirdNameEn,
    ),

  lastNameEn:
    normalizeString(
      pilgrim.lastNameEn,
    ),

  nationality:
    normalizeString(
      pilgrim.nationality,
    ),

  gender:
    pilgrim.gender || "male",

  birthDate:
    normalizeDate(
      pilgrim.birthDate,
    ),

  phone:
    normalizeString(
      pilgrim.phone,
    ),

  whatsapp:
    normalizeString(
      pilgrim.whatsapp,
    ),

  passportExpiryDate:
    normalizeDate(
      pilgrim.passportExpiryDate,
    ),

  documents:
    normalizeArray(
      pilgrim.documents,
    ),
});


// =============================
// Travelers Summary
// =============================

export const normalizeTravelers =
  (travelers = {}) => ({
    adults: Math.max(
      1,
      normalizeNumber(
        travelers.adults,
        1,
      ),
    ),

    children: Math.max(
      0,
      normalizeNumber(
        travelers.children,
      ),
    ),

    infants: Math.max(
      0,
      normalizeNumber(
        travelers.infants,
      ),
    ),
  });


// =============================
// Booking Pricing
// =============================

export const normalizeBookingPricing =
  (pricing = {}) => ({
    currency:
      pricing.currency || "SAR",

    subtotal:
      normalizeNumber(
        pricing.subtotal,
      ),

    taxAmount:
      normalizeNumber(
        pricing.taxAmount,
      ),

    discountAmount:
      normalizeNumber(
        pricing.discountAmount,
      ),

    totalAmount:
      normalizeNumber(
        pricing.totalAmount,
      ),
  });


// =============================
// Payment
// =============================

export const normalizePayment =
  (payment = {}) => ({
    paymentMethod:
      payment.paymentMethod ||
      "cash",

    paymentStatus:
      payment.paymentStatus ||
      "pending",

    transactionId:
      normalizeString(
        payment.transactionId,
      ),

    paidAmount:
      normalizeNumber(
        payment.paidAmount,
      ),

    remainingAmount:
      normalizeNumber(
        payment.remainingAmount,
      ),
  });


// =============================
// Booking
// =============================

export const normalizeBooking =
  (data = {}) => ({
    bookingNumber:
      normalizeString(
        data.bookingNumber,
      ),

    user: data.user,

    pilgrims: normalizeArray(
      data.pilgrims,
    ).map(normalizePilgrim),

    travelers:
      normalizeTravelers(
        data.travelers,
      ),

    visa:
      data.visa || undefined,

    hotel:
      data.hotel || undefined,

    roomType:
      data.roomType || undefined,

    transport:
      data.transport || undefined,

    trip:
      data.trip || undefined,

    checkIn:
      normalizeDate(
        data.checkIn,
      ),

    checkOut:
      normalizeDate(
        data.checkOut,
      ),

    travelDate:
      normalizeDate(
        data.travelDate,
      ),

    returnDate:
      normalizeDate(
        data.returnDate,
      ),

    pricing:
      normalizeBookingPricing(
        data.pricing,
      ),

    payment:
      normalizePayment(
        data.payment,
      ),

    bookingStatus:
      data.bookingStatus ||
      "draft",

    notes:
      normalizeString(
        data.notes,
      ),

    isActive:
      normalizeBoolean(
        data.isActive,
      ),

    createdBy:
      data.createdBy,

    updatedBy:
      data.updatedBy,
  });
