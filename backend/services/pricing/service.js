// /*
// حساب السعر الناهئي بناءً على السعر الأساسي والكمية.
// المعطيات:
// - basePrice: السعر الأساسي للوحدة (مثل سعر الليلة في الفندق أو سعر التذكرة في الرحلة).
// - quantity: عدد الوحدات المطلوبة (مثل عدد الليالي أو عدد التذاكر).
// */
// // utils/calculatePrice.js

// import { roundPrice } from "../../utils/roundPrice.js";

// // ==================== Defaults ====================

// export const DEFAULT_TAX_RATE = 15;
// export const DEFAULT_CHILD_DISCOUNT = 0.5;

// // ==================== Day Mapping ====================

// const DAYS = [
//   "sunday",
//   "monday",
//   "tuesday",
//   "wednesday",
//   "thursday",
//   "friday",
//   "saturday",
// ];

// const getDayName = (date) => {
//   return DAYS[new Date(date).getDay()];
// };

// // ==================== Date Helpers ====================

// const normalizeDateOnly = (date) => {
//   const d = new Date(date);

//   return new Date(d.getFullYear(), d.getMonth(), d.getDate());
// };

// // ==================== Period Matching ====================

// const checkPeriodMatch = (checkDate, dayName, period) => {
//   switch (period.periodType) {
//     case "weekend":
//       return period.days?.includes(dayName);

//     case "seasonal":
//     case "holiday":
//     case "custom":
//       if (!period.startDate || !period.endDate) {
//         return false;
//       }

//       const start = normalizeDateOnly(period.startDate);

//       const end = normalizeDateOnly(period.endDate);

//       const current = normalizeDateOnly(checkDate);

//       // timezone-safe compare
//       return (
//         current.getTime() >= start.getTime() &&
//         current.getTime() <= end.getTime()
//       );

//     default:
//       return false;
//   }
// };

// // ==================== Get Price ====================

// export const getPriceForDate = (date, pricing) => {
//   const checkDate = normalizeDateOnly(date);

//   const dayName = getDayName(checkDate);

//   const activePeriods = pricing.pricingPeriods
//     ?.filter((p) => p.isActive)
//     ?.sort((a, b) => (b.priority || 0) - (a.priority || 0));

//   for (const period of activePeriods || []) {
//     if (checkPeriodMatch(checkDate, dayName, period)) {
//       return {
//         type: period.periodType,

//         name: {
//           ar: period.nameAr,

//           en: period.nameEn,
//         },

//         price: period.price,

//         source: "pricingPeriod",

//         periodId: period._id,
//       };
//     }
//   }

//   // base price
//   return {
//     type: "base",

//     name: {
//       ar: "سعر عادي",
//       en: "Base Price",
//     },

//     price: pricing.basePrice,

//     source: "base",
//   };
// };

// // ==================== Nightly Rate ====================

// export const calculateNightlyRate = (date, pricing) => {
//   const dayPricing = getPriceForDate(date, pricing);

//   let nightPrice = dayPricing.price;

//   let discountApplied = 0;

//   // discount only on base price
//   if (pricing.discountPercent > 0 && dayPricing.source === "base") {
//     discountApplied = roundPrice(nightPrice * (pricing.discountPercent / 100));

//     nightPrice -= discountApplied;
//   }

//   return {
//     date: normalizeDateOnly(date).toISOString().split("T")[0],

//     dayName: {
//       ar: new Date(date).toLocaleDateString("ar-SA", {
//         weekday: "long",
//       }),

//       en: new Date(date).toLocaleDateString("en-US", {
//         weekday: "long",
//       }),
//     },

//     type: dayPricing.type,

//     typeName: dayPricing.name,

//     originalPrice: dayPricing.price,

//     discountApplied,

//     finalPrice: roundPrice(nightPrice),

//     source: dayPricing.source,
//   };
// };

// // ==================== Booking Price ====================

// export const calculateBookingPrice = ({
//   roomType,
//   checkIn,
//   checkOut,
//   adults = 1,
//   children = 0,
//   taxRate = DEFAULT_TAX_RATE,
// }) => {
//   const checkInDate = normalizeDateOnly(checkIn);

//   const checkOutDate = normalizeDateOnly(checkOut);

//   const nights = Math.ceil(
//     (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24),
//   );

//   if (nights <= 0) {
//     throw new Error("تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول");
//   }

//   const pricing = roomType.pricing;

//   const nightlyBreakdown = [];

//   let subtotal = 0;

//   // calculate each night
//   for (let i = 0; i < nights; i++) {
//     const currentDate = new Date(checkInDate);

//     currentDate.setDate(currentDate.getDate() + i);

//     const nightDetails = calculateNightlyRate(currentDate, pricing);

//     nightlyBreakdown.push(nightDetails);

//     subtotal += nightDetails.finalPrice;
//   }

//   // adults
//   const adultTotal = roundPrice(subtotal * adults);

//   // children (FIXED)
//   const childTotal = roundPrice(
//     nightlyBreakdown.reduce((sum, night) => {
//       return sum + night.finalPrice * DEFAULT_CHILD_DISCOUNT * children;
//     }, 0),
//   );

//   const totalBeforeTax = roundPrice(adultTotal + childTotal);

//   const taxAmount = roundPrice(totalBeforeTax * (taxRate / 100));

//   const totalPrice = roundPrice(totalBeforeTax + taxAmount);

//   return {
//     nights,

//     checkIn,

//     checkOut,

//     nightlyBreakdown,

//     summary: {
//       baseTotal: roundPrice(subtotal),

//       adultTotal,

//       childTotal,

//       discountTotal: roundPrice(
//         nightlyBreakdown.reduce(
//           (sum, n) => sum + n.discountApplied,

//           0,
//         ),
//       ),

//       subtotal: totalBeforeTax,

//       taxRate,

//       taxAmount,

//       totalPrice,
//     },

//     currency: pricing.currency || "SAR",
//   };
// };

// // ==================== Availability ====================

// export const checkAvailability = async ({
//   roomTypeId,
//   checkIn,
//   checkOut,
//   requestedRooms = 1,
//   RoomType,
//   Booking,
// }) => {
//   const roomType = await RoomType.findById(roomTypeId);

//   if (!roomType) {
//     throw new Error("نوع الغرفة غير موجود");
//   }

//   const totalRooms = roomType.totalRooms || 0;

//   const checkInDate = new Date(checkIn);

//   const checkOutDate = new Date(checkOut);

//   // FIXED:
//   // count reserved rooms
//   const result = await Booking.aggregate([
//     {
//       $match: {
//         roomType: roomType._id,

//         status: {
//           $nin: ["cancelled", "rejected"],
//         },

//         $or: [
//           {
//             checkIn: {
//               $lte: checkOutDate,
//             },

//             checkOut: {
//               $gte: checkInDate,
//             },
//           },
//         ],
//       },
//     },

//     {
//       $group: {
//         _id: null,

//         totalReserved: {
//           $sum: "$reservedRooms",
//         },
//       },
//     },
//   ]);

//   const bookedCount = result[0]?.totalReserved || 0;

//   const available = Math.max(0, totalRooms - bookedCount);

//   const canBook = available >= requestedRooms;

//   return {
//     totalRooms,

//     bookedCount,

//     available,

//     requestedRooms,

//     canBook,

//     occupancyRate: roundPrice(
//       totalRooms > 0 ? (bookedCount / totalRooms) * 100 : 0,
//     ),
//   };
// };

// /**
//  * حساب السعر النهائي مع الضريبة
//  */
// /*
// export const calculatePrice = ({
//   basePrice,
//   quantity = 1,
//   taxRate = 15,
//   discountPercent = 0,
// }) => {
//   const base = Number(basePrice);
//   const qty = Number(quantity);
//   const discount = Number(discountPercent);
//   const tax = Number(taxRate);

//   // السعر بعد الخصم
//   const discountedPrice = base * (1 - discount / 100);
  
//   // المجموع الفرعي
//   const subtotal = discountedPrice * qty;
  
//   // الضريبة
//   const taxAmount = subtotal * (tax / 100);
  
//   // الإجمالي
//   const totalPrice = subtotal + taxAmount;

//   return {
//     basePrice: base,
//     discountPercent: discount,
//     discountedPrice,      // ← سعر الوحدة بعد الخصم
//     quantity: qty,
//     subtotal,             // ← المجموع قبل الضريبة
//     taxRate: tax,
//     taxAmount,            // ← مبلغ الضريبة
//     totalPrice,           // ← الإجمالي النهائي
//     savings: (base - discountedPrice) * qty,  // ← مبلغ التوفير
//   };
// };

// /**
//  * حساب سعر الحجز الكامل (للغرفة)
//  */
// // export const calculateBookingPrice = ({
// //   roomType,
// //   nights = 1,
// //   adults = 1,
// //   children = 0,
// //   taxRate = 15,
// // }) => {
// //   const finalPricePerNight = roomType.pricing?.finalPrice || 0;

// //   // تسعير الأطفال (نصف السعر)
// //   const adultTotal = finalPricePerNight * adults * nights;
// //   const childTotal = (finalPricePerNight * 0.5) * children * nights;

// //   const subtotal = adultTotal + childTotal;
// //   const taxAmount = subtotal * (taxRate / 100);
// //   const totalPrice = subtotal + taxAmount;

// //   return {
// //      nights,
// //     adults: {
// //       count: adults,
// //       pricePerNight: roundPrice(finalPricePerNight),
// //       total: roundPrice(adultTotal)
// //     },
// //     children: {
// //       count: children,
// //       pricePerNight: roundPrice(finalPricePerNight * 0.5),
// //       total: roundPrice(childTotal)
// //     },
// //     subtotal: roundPrice(subtotal),
// //     taxRate,
// //     taxAmount: roundPrice(taxAmount),
// //     totalPrice: roundPrice(totalPrice),
// //     currency: roomType.pricing?.currency || 'SAR',
// //   };
// // };
// // /**
// //  * حساب تفصيلي لليالي (يدعم أسعار مختلفة)
// //  */
// // export const calculateNightlyBreakdown = ({
// //   nightlyRates = [],  // مصفوفة بأسعار كل ليلة [{price, type, date}, ...]
// //   adults = 1,
// //   children = 0,
// //   taxRate = 15,
// // }) => {
// //   let subtotal = 0;

// //   const breakdown = nightlyRates.map(night => {
// //     const adultPrice = night.price * adults;
// //     const childPrice = (night.price * 0.5) * children;
// //     const nightTotal = adultPrice + childPrice;
// //     subtotal += nightTotal;

// //     return {
// //       date: night.date,
// //       type: night.type || 'base',
// //       originalPrice: roundPrice(night.price),
// //       adultPrice: roundPrice(adultPrice),
// //       childPrice: roundPrice(childPrice),
// //       nightTotal: roundPrice(nightTotal),
// //     };
// //   });

// //   const taxAmount = subtotal * (taxRate / 100);
// //   const totalPrice = subtotal + taxAmount;

// //   return {
// //     nights: nightlyRates.length,
// //     breakdown,
// //     subtotal: roundPrice(subtotal),
// //     taxRate,
// //     taxAmount: roundPrice(taxAmount),
// //     totalPrice: roundPrice(totalPrice),
// //   };
// // };
// // /**
// //  * حساب التوفر
// //  */
// // export const calculateAvailability = async (roomTypeId, checkIn, checkOut, RoomType, Booking) => {
// //   const roomType = await RoomType.findById(roomTypeId);
// //   if (!roomType) throw new Error('Room type not found');

// //   const totalRooms = roomType.totalRooms || 0;

// //   // عدد الحجوزات في الفترة
// //   const bookedCount = await Booking.countDocuments({
// //     roomType: roomTypeId,
// //     status: { $nin: ['cancelled', 'rejected'] },
// //     $or: [
// //       { checkIn: { $lte: new Date(checkOut) }, checkOut: { $gte: new Date(checkIn) } }
// //     ]
// //   });

// //   const available = Math.max(0, totalRooms - bookedCount);

// //   return {
// //     totalRooms,
// //     bookedCount,
// //     available,
// //     occupancyRate: roundPrice(totalRooms > 0 ? (bookedCount / totalRooms) * 100 : 0),
// //     isAvailable: available > 0,
// //   };
// // };
