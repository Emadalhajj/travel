/*
=====================================================
Package Availability Service
=====================================================

هذا الملف مسؤول عن إرجاع المنتجات المتاحة حسب الفترة الزمنية.

يستخدم في:
- إنشاء برنامج عمرة من لوحة الإدارة
- عرض الخدمات المتاحة حسب startDate و endDate
=====================================================
*/

import RoomType from "../../models/hotels/roomtype-model.js";
import Visa from "../../models/visa-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import Transport from "../../models/transportition/transport-model.js";
import VehicleRental from "../../models/transportition/vehicle-rental-model.js";


import Inventory from "../../models/inventory-model.js";
import ExtraService from "../../models/extra-services/extra-service-model.js";
import {
  calculateAvailableCount,
  filterProductsByInventory,
  filterProductsByAvailabilityPolicy,
  getInventoryAvailabilityByProduct,
} from "../../services/availability/inventory-availability-service.js";
import { TRIP_TYPES } from "../../constants/trips/trip.constants.js";
import { TRIP_DEPARTURE_STATUS } from "../../constants/trips/trip-departure.constants.js";
import { INVENTORY_TYPES } from "../../constants/inventory/inventory-types.js";

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

  const sellableRoomTypes = roomTypes.map((roomType) => ({
    roomType,
    matchedSellablePeriod: isRoomSellableInPeriod({
      roomType,
      startDate,
      endDate,
    }),
  })).filter(({ matchedSellablePeriod }) => matchedSellablePeriod);
  const availabilityByRoomTypeId = await getInventoryAvailabilityByProduct({
    products: sellableRoomTypes.map(({ roomType }) => roomType),
    Inventory,
    inventoryType: "roomType",
    startDate,
    endDate,
    requestedQuantity: requestedRooms,
  });
  const result = [];

  for (const { roomType, matchedSellablePeriod } of sellableRoomTypes) {
    const inventoryAvailability = availabilityByRoomTypeId.get(String(roomType._id));
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
Trip هو تعريف المنتج، بينما TripDeparture هو العنصر القابل للبيع.
لكل Departure سجل Inventory مستقل، وليس سجلًا لكل يوم في فترة البرنامج.
*/
const getTripDepartureInventory = async ({
  departures,
  pilgrimsCount,
}) => {
  if (!departures.length) return new Map();

  const departureIds = departures.map(({ _id }) => _id);
  const records = await Inventory.find({
    inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
    itemId: { $in: departureIds },
    isActive: true,
    isDeleted: { $ne: true },
  })
    .select("itemId total reserved blocked available")
    .lean();

  const requested = Number(pilgrimsCount || 1);
  const availabilityByDepartureId = new Map();

  for (const record of records) {
    const storedAvailable = Number(record.available);
    const availableCount =
      Number.isFinite(storedAvailable) && storedAvailable >= 0
        ? storedAvailable
        : calculateAvailableCount(record);

    availabilityByDepartureId.set(String(record.itemId), {
      isAvailable: availableCount >= requested,
      availableCount,
      total: Number(record.total || 0),
      reserved: Number(record.reserved || 0),
      blocked: Number(record.blocked || 0),
      available: availableCount,
    });
  }

  return availabilityByDepartureId;
};

const getAvailableTrips = async ({ startDate, endDate, pilgrimsCount = 1 }) => {
  const now = new Date();
  const departures = await TripDeparture.find({
    departureAt: {
      $gte: startDate,
      $lt: endDate,
      $gt: now,
    },
    status: TRIP_DEPARTURE_STATUS.SCHEDULED,
    isActive: true,
    isDeleted: { $ne: true },
  })
    .populate({
      path: "tripId",
      match: {
        isActive: true,
        isDeleted: { $ne: true },
      },
      select: [
        "nameAr",
        "nameEn",
        "descriptionAr",
        "descriptionEn",
        "images",
        "type",
        "scope",
        "subtype",
        "source",
        "fromCity",
        "toCity",
        "features",
        "airline",
        "flightNumber",
        "originAirport",
        "destinationAirport",
        "cabinClass",
        "baggage",
        "transportId",
        "routeStops",
        "vesselName",
        "ports",
        "cabinTypes",
        "mealsIncluded",
        "baggagePolicy",
      ].join(" "),
    })
    .lean();

  const validDepartures = departures.filter(({ tripId }) => Boolean(tripId));
  const availabilityByDepartureId = await getTripDepartureInventory({
    departures: validDepartures,
    pilgrimsCount,
  });

  return validDepartures
    .filter(({ _id }) =>
      availabilityByDepartureId.get(String(_id))?.isAvailable,
    )
    .map((departure) => {
      const trip = departure.tripId;
      const availability = availabilityByDepartureId.get(
        String(departure._id),
      );
      const basePrice = getNumber(departure.pricing?.basePrice);
      const discountPrice = getNumber(departure.pricing?.discountPrice);

      return {
        _id: departure._id,
        type: trip.type === TRIP_TYPES.AIR ? "flight" : "trip",
        category: trip.type === TRIP_TYPES.AIR ? "flights" : "trips",
        tripId: trip._id,
        departureId: departure._id,
        nameAr: trip.nameAr || "",
        nameEn: trip.nameEn || "",
        descriptionAr: trip.descriptionAr || "",
        descriptionEn: trip.descriptionEn || "",
        images: trip.images || [],
        tripType: trip.type,
        scope: trip.scope,
        subtype: trip.subtype,
        source: departure.source || trip.source,
        fromCity: trip.fromCity,
        toCity: trip.toCity,
        features: trip.features,
        airline: trip.airline,
        flightNumber: trip.flightNumber,
        originAirport: trip.originAirport,
        destinationAirport: trip.destinationAirport,
        cabinClass: trip.cabinClass,
        baggage: trip.baggage,
        transport: trip.transportId,
        routeStops: trip.routeStops || [],
        vesselName: trip.vesselName,
        ports: trip.ports || [],
        cabinTypes: trip.cabinTypes,
        mealsIncluded: trip.mealsIncluded,
        baggagePolicy: trip.baggagePolicy,
        departureAt: departure.departureAt,
        arrivalAt: departure.arrivalAt,
        segments: departure.segments || [],
        status: departure.status,
        price: discountPrice > 0 ? discountPrice : basePrice,
        basePrice,
        discountPrice,
        currency: departure.pricing?.currency || "SAR",
        pricing: {
          basePrice,
          discountPrice,
          finalPrice: discountPrice > 0 ? discountPrice : basePrice,
          currency: departure.pricing?.currency || "SAR",
        },
        inventory: {
          total: availability.total,
          reserved: availability.reserved,
          blocked: availability.blocked,
          available: availability.available,
        },
        availableCount: availability.availableCount,
        inventoryAvailability: availability,
        isActive: departure.isActive,
      };
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
export const getAvailablePackageProductsService = async ({
  startDate,
  endDate,
  pilgrimsCount = 1,
}) => {
  const requestedCount = getNumber(pilgrimsCount, 1);

  const [roomTypes, visas, trips, transports, extraServices, vehicleRentals] =
    await Promise.all([
      getAvailableRoomTypes({ startDate, endDate, requestedRooms: 1 }),
      getAvailableVisas({ startDate, endDate, pilgrimsCount: requestedCount }),
      getAvailableTrips({ startDate, endDate, pilgrimsCount: requestedCount }),
      getAvailableTransports({ startDate, endDate, pilgrimsCount: requestedCount }),
      getAvailableExtraServices({ startDate, endDate, pilgrimsCount: requestedCount }),
      getAvailableVehicleRentals({ startDate, endDate, pilgrimsCount: requestedCount }),
    ]);

  const flights = trips.filter(({ tripType }) => tripType === TRIP_TYPES.AIR);
  const nonAirTrips = trips.filter(({ tripType }) => tripType !== TRIP_TYPES.AIR);

  return {
    roomTypes,
    visas,
    trips: nonAirTrips,
    transports,
    extraServices,
    vehicleRentals,
    hotels: getHotelsFromAvailableRooms(roomTypes),
    flights,
    ziyarats: [],
    services: extraServices,
  };
};
