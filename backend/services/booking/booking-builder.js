/*
يكون مسؤولاً فقط عن:

تجميع بيانات الحجز
Build Booking Object
*/
import { normalizeArray } from "../../utils/generic/normalizeArray.js";


// export const buildBookingData =
// async ({
//   roomType,
//   hotel,
//   visa,
//   transport
// }) => {

//   return {

//     services: {

//       hotel: {
//         hotelId: hotel._id,

//         snapshot: {
//           hotelNameAr:
//             hotel.nameAr,

//           hotelNameEn:
//             hotel.nameEn,
//         },
//       },

//       roomType: {
//         roomTypeId:
//           roomType._id,

//         snapshot: {
//           roomNameAr:
//             roomType.nameAr,

//           roomNameEn:
//             roomType.nameEn,

//           price:
//             roomType
//             .pricing
//             .basePrice,
//         },
//       },
//     },
//   };
// };


// =============================
// Build Travelers Summary
// =============================

export const buildTravelersSummary = (
  pilgrims = [],
) => {
  const normalizedPilgrims =
    normalizeArray(pilgrims);

  let adults = 0;
  let children = 0;
  let infants = 0;

  normalizedPilgrims.forEach(
    (pilgrim) => {
      const birthDate =
        pilgrim.birthDate
          ? new Date(
              pilgrim.birthDate,
            )
          : null;

      if (!birthDate) {
        adults++;
        return;
      }

      const age =
        Math.floor(
          (Date.now() -
            birthDate.getTime()) /
            (365.25 *
              24 *
              60 *
              60 *
              1000),
        );

      if (age < 2) {
        infants++;
      } else if (age < 12) {
        children++;
      } else {
        adults++;
      }
    },
  );

  return {
    adults,
    children,
    infants,
    total:
      adults +
      children +
      infants,
  };
};


// =============================
// Build Booking References
// =============================

export const buildBookingReferences =
  ({
    visa,
    hotel,
    roomType,
    transport,
    trip,
  }) => ({
    visa:
      visa?._id ||
      visa ||
      undefined,

    hotel:
      hotel?._id ||
      hotel ||
      undefined,

    roomType:
      roomType?._id ||
      roomType ||
      undefined,

    transport:
      transport?._id ||
      transport ||
      undefined,

    trip:
      trip?._id ||
      trip ||
      undefined,
  });


// =============================
// Build Booking Dates
// =============================

export const buildBookingDates =
  ({
    travelDate,
    returnDate,
    checkIn,
    checkOut,
  }) => ({
    travelDate:
      travelDate
        ? new Date(travelDate)
        : undefined,

    returnDate:
      returnDate
        ? new Date(returnDate)
        : undefined,

    checkIn:
      checkIn
        ? new Date(checkIn)
        : undefined,

    checkOut:
      checkOut
        ? new Date(checkOut)
        : undefined,
  });


// =============================
// Build Payment Object
// =============================

export const buildPaymentData =
  ({
    paymentMethod,
    paymentStatus,
    transactionId,
    paidAmount,
    remainingAmount,
  }) => ({
    paymentMethod:
      paymentMethod ||
      "cash",

    paymentStatus:
      paymentStatus ||
      "pending",

    transactionId:
      transactionId || "",

    paidAmount:
      Number(
        paidAmount,
      ) || 0,

    remainingAmount:
      Number(
        remainingAmount,
      ) || 0,
  });


// =============================
// Build Pricing Object
// =============================

export const buildPricingData =
  ({
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    currency,
  }) => ({
    subtotal:
      Number(
        subtotal,
      ) || 0,

    taxAmount:
      Number(
        taxAmount,
      ) || 0,

    discountAmount:
      Number(
        discountAmount,
      ) || 0,

    totalAmount:
      Number(
        totalAmount,
      ) || 0,

    currency:
      currency || "SAR",
  });


// =============================
// Main Builder
// =============================

export const buildBookingData =
  ({
    user,
    pilgrims = [],

    visa,
    hotel,
    roomType,
    transport,
    trip,

    travelDate,
    returnDate,
    checkIn,
    checkOut,

    pricing = {},
    payment = {},

    bookingStatus,
    notes,

    createdBy,
    updatedBy,
  }) => {
    return {
      user,

      pilgrims,

      travelers:
        buildTravelersSummary(
          pilgrims,
        ),

      ...buildBookingReferences({
        visa,
        hotel,
        roomType,
        transport,
        trip,
      }),

      ...buildBookingDates({
        travelDate,
        returnDate,
        checkIn,
        checkOut,
      }),

      pricing:
        buildPricingData(
          pricing,
        ),

      payment:
        buildPaymentData(
          payment,
        ),

      bookingStatus:
        bookingStatus ||
        "draft",

      notes:
        notes || "",

      createdBy,
      updatedBy,
    };
  };