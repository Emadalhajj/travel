/*
=====================================================
Availability Controller
=====================================================

هذا الملف مسؤول عن إرجاع المنتجات المتاحة حسب الفترة الزمنية.

يستخدم في:
- إنشاء برنامج عمرة من لوحة الإدارة
- عرض الخدمات المتاحة حسب startDate و endDate
=====================================================
*/

import AppError from "../../utils/AppError.js";
import asyncHandler from "express-async-handler";
import RoomType from "../../models/hotels/roomtype-model.js";
import Visa from "../../models/visa-model.js";
import Trip from "../../models/transportition/trip-model.js";
import Transport from "../../models/transportition/transport-model.js";
import VehicleRental from "../../models/transportition/vehicle-rental-model.js";

import { normalizeDate } from "../../services/booking/availability.js";

// check availablety
import Inventory from "../../models/inventory-model.js";
import ExtraService from "../../models/extra-services/extra-service-model.js";
import {
  checkInventoryForWholePeriod,
  filterProductsByInventory,
  filterProductsByAvailabilityPolicy,
} from "../../services/availability/inventory-availability-service.js";

/*
=====================================================
Helpers
=====================================================
*/

const getNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isNaN(number) ? fallback : number;
};

const getBasePrice = (doc) => {
  return (
    getNumber(doc?.pricing?.basePrice) ||
    getNumber(doc?.price) ||
    getNumber(doc?.basePrice) ||
    0
  );
};

const getCurrency = (doc) => {
  return doc?.pricing?.currency || doc?.currency || "SAR";
};

//
const getLocalizedValue = (doc, fields = [], lang = "ar") => {
  for (const field of fields) {
    const value = doc?.[field];

    if (!value) continue;

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    if (typeof value === "object") {
      return value?.[lang] || value?.ar || value?.en || "";
    }
  }

  return "";
};

const mapProduct = ({ doc, type, availableCount = null, extra = {} }) => {
  return {
    _id: doc._id,
    type,

    nameAr: getLocalizedValue(
      doc,
      ["nameAr", "titleAr", "name", "title"],
      "ar",
    ),
    nameEn: getLocalizedValue(
      doc,
      ["nameEn", "titleEn", "name", "title"],
      "en",
    ),

    descriptionAr: getLocalizedValue(
      doc,
      ["descriptionAr", "detailsAr", "description", "details"],
      "ar",
    ),
    descriptionEn: getLocalizedValue(
      doc,
      ["descriptionEn", "detailsEn", "description", "details"],
      "en",
    ),
    images: doc.images || [],

    price: getBasePrice(doc),
    currency: getCurrency(doc),

    isActive: doc.isActive,

    availableCount,

    ...extra,
  };
};

const mapRoomTypeProduct = ({ roomType, availableCount, extra = {} }) => {
  return mapProduct({
    doc: roomType,
    type: "room",
    availableCount,
    extra: {
      ...extra,

      hotel: roomType.hotel || null,

      hotelId:
        typeof roomType.hotel === "object"
          ? roomType.hotel?._id
          : roomType.hotel,

      hotelNameAr:
        typeof roomType.hotel === "object"
          ? roomType.hotel?.nameAr || roomType.hotel?.name?.ar || ""
          : "",

      hotelNameEn:
        typeof roomType.hotel === "object"
          ? roomType.hotel?.nameEn || roomType.hotel?.name?.en || ""
          : "",

      bedType: roomType.bedType,
      mealPlan: roomType.mealPlan,
      capacity: roomType.capacity,
      totalRooms: roomType.totalRooms,
    },
  });
};

/*
=====================================================
Room Types Availability
=====================================================

يعتمد على:
- Inventory يغطي كامل فترة البرنامج
- السعر العام أو فترات التسعير لا تعني توفر الغرفة
=====================================================
*/
const isRoomSellableInPeriod = ({ roomType, startDate, endDate }) => {
  const programStart = new Date(startDate);
  const programEnd = new Date(endDate);

  const periods = roomType.availability?.availablePeriods || [];

  return periods.find((period) => {
    if (!period.isActive) return false;

    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);

    return programStart >= periodStart && programEnd <= periodEnd;
  });
};
const getAvailableRoomTypes = async ({
  startDate,
  endDate,
  requestedRooms = 1,
}) => {
  const roomTypes = await RoomType.find({
    isActive: true,
    isDeleted: { $ne: true },
  })
    .populate("hotel")
    .lean();

  const result = [];

  for (const roomType of roomTypes) {
    const matchedSellablePeriod = isRoomSellableInPeriod({
      roomType,
      startDate,
      endDate,
    });
    if (!matchedSellablePeriod) {
      continue;
    }

    const inventoryAvailability = await checkInventoryForWholePeriod({
      Inventory,
      inventoryType: "roomType",
      itemId: roomType._id,
      startDate,
      endDate,
      requestedQuantity: requestedRooms,
    });
    if (!inventoryAvailability.isAvailable) {
      continue;
    }

    result.push(
      mapRoomTypeProduct({
        roomType,
        availableCount: inventoryAvailability.minAvailable,
        extra: {
          availabilityReason: "SELLABLE_PERIOD_AND_INVENTORY",
          matchedSellablePeriod,
          inventoryAvailability,
        },
      }),
    );
  }

  return result;
};
/*
=====================================================
Hotels From Available Rooms
=====================================================

الفنادق لا يتم اعتبارها متاحة إلا إذا كان لديها نوع غرفة متاح.
=====================================================
*/

const getHotelsFromAvailableRooms = (availableRoomTypes = []) => {
  const hotelsMap = new Map();

  availableRoomTypes.forEach((roomType) => {
    const hotel = roomType.hotel;

    if (!hotel || !hotel._id) return;

    const hotelId = hotel._id.toString();

    if (!hotelsMap.has(hotelId)) {
      hotelsMap.set(hotelId, {
        ...mapProduct({
          doc: hotel,
          type: "hotel",
          availableCount: null,
          extra: {
            roomTypes: [],
          },
        }),
      });
    }

    hotelsMap.get(hotelId).roomTypes.push(roomType);
  });

  return Array.from(hotelsMap.values());
};

/*
=====================================================
Visas Availability
=====================================================
السياسة:
visa = غالبًا دائمة التوفر
لكن إذا isAlwaysAvailable = false تعتمد على Inventory
=====================================================
*/
const getAvailableVisas = async ({ startDate, endDate, pilgrimsCount = 1 }) => {
  const visas = await Visa.find({
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();

  return filterProductsByAvailabilityPolicy({
    products: visas,
    Inventory,
    inventoryType: "visa",
    startDate,
    endDate,
    requestedQuantity: pilgrimsCount,
    mapProduct,
  });
};

/*
=====================================================
Trips Availability
=====================================================

السياسة:
trip = حسب Inventory دائمًا
*/
const getAvailableTrips = async ({ startDate, endDate, pilgrimsCount = 1 }) => {
  const trips = await Trip.find({
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();

  const normalizedStartDate = normalizeDate(startDate);
  const normalizedEndDate = normalizeDate(endDate);
  const tripsInPeriod = trips.filter((trip) => {
      const tripStartDate = normalizeDate(trip.startDate);
      if (!tripStartDate) return false;
      return tripStartDate >= normalizedStartDate && tripStartDate < normalizedEndDate;
    });

  return filterProductsByInventory({
    products: tripsInPeriod,
    Inventory,
    inventoryType: "trip",
    startDate,
    endDate,
    requestedQuantity: pilgrimsCount,
    mapProduct: (args) => mapProduct({
      ...args,
      extra: {
        ...args.extra,
        startDate: args.doc.startDate,
        capacity: args.doc.capacity,
      },
    }),
  });
};

/*
=====================================================
Transports Availability
=====================================================
السياسة:
transport = Inventory أو isAlwaysAvailable
*/
const getAvailableTransports = async ({
  startDate,
  endDate,
  pilgrimsCount = 1,
}) => {
  const transports = await Transport.find({
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();

  return filterProductsByAvailabilityPolicy({
    products: transports,
    Inventory,
    inventoryType: "transport",
    startDate,
    endDate,
    requestedQuantity: pilgrimsCount,
    mapProduct,
  });
};
/*
=====================================================
Extra Services
=====================================================

السياسة:
extraService = حسب نوع الخدمة
- isAlwaysAvailable true: تظهر دائمًا
- false: حسب Inventory
=====================================================
*/

const getAvailableExtraServices = async ({
  startDate,
  endDate,
  pilgrimsCount = 1,
}) => {
  const services = await ExtraService.find({
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();

  return filterProductsByAvailabilityPolicy({
    products: services,
    Inventory,
    inventoryType: "extraService",
    startDate,
    endDate,
    requestedQuantity: pilgrimsCount,
    mapProduct,
  });
};

/*
=====================================================
Vehicle Rentals Availability
=====================================================
السياسة:
vehicleRental = Inventory أو isAlwaysAvailable
=====================================================

*/
const getAvailableVehicleRentals = async ({
  startDate,
  endDate,
  pilgrimsCount = 1,
}) => {
  const rentals = await VehicleRental.find({
    isActive: true,
    isDeleted: { $ne: true },
  })
    .populate("transport")
    .lean();

  return filterProductsByAvailabilityPolicy({
    products: rentals,
    Inventory,
    inventoryType: "vehicleRental",
    startDate,
    endDate,
    requestedQuantity: pilgrimsCount,
    mapProduct: (args) => {
      const rental = args.doc;

      return mapProduct({
        ...args,
        extra: {
          ...args.extra,
          rentalType: rental.rentalType,
          transport: rental.transport,
          vehicleType: rental.transport?.vehicleType,
          capacity: rental.transport?.capacity,
        },
      });
    },
  });
};
/*
=====================================================
GET /api/availability/products
=====================================================
*/

//
export const getAvailablePackageProducts = asyncHandler(
  async (req, res, next) => {
    const { startDate, endDate, pilgrimsCount = 1 } = req.query;

    if (!startDate || !endDate) {
      return next(
        new AppError("startDate و endDate مطلوبة لجلب المنتجات المتاحة", 400),
      );
    }

    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    if (!normalizedStartDate || !normalizedEndDate) {
      return next(new AppError("صيغة التاريخ غير صحيحة", 400));
    }

    if (normalizedEndDate <= normalizedStartDate) {
      return next(
        new AppError("تاريخ نهاية البرنامج يجب أن يكون بعد تاريخ البداية", 400),
      );
    }

    const requestedCount = getNumber(pilgrimsCount, 1);

    const [roomTypes, visas, trips, transports, extraServices, vehicleRentals] =
      await Promise.all([
        getAvailableRoomTypes({
          startDate,
          endDate,
          requestedRooms: 1,
        }),

        getAvailableVisas({
          startDate,
          endDate,
          pilgrimsCount: requestedCount,
        }),

        getAvailableTrips({
          startDate,
          endDate,
          pilgrimsCount: requestedCount,
        }),

        getAvailableTransports({
          startDate,
          endDate,
          pilgrimsCount: requestedCount,
        }),

        getAvailableExtraServices({
          startDate,
          endDate,
          pilgrimsCount: requestedCount,
        }),

        getAvailableVehicleRentals({
          startDate,
          endDate,
          pilgrimsCount: requestedCount,
        }),
      ]);

    res.status(200).json({
      success: true,
      message: "Available products fetched successfully",
      data: {
        roomTypes,
        visas,
        trips,
        transports,
        extraServices,
        vehicleRentals,

        // مفاتيح للفرونت
        hotels: getHotelsFromAvailableRooms(roomTypes),
        flights: [],
        ziyarats: [],
        services: extraServices,
      },
    });
  },
);
