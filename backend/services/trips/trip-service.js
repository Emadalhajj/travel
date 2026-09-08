import Trip from "../../models/transportition/trip-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import AppError from "../../utils/AppError.js";

import { isTripSubtypeAllowed } from "../../constants/trips/trip.constants.js";
import { createAuditLog } from "../audit/audit-log-service.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";
import {
  softDeleteDocument,
  restoreDeletedDocument,
} from "../../utils/softDelete.js";

/*
=====================================================
TRIP SERVICE
=====================================================

مسؤول عن Business Logic الخاص بالرحلات.

Controller:
- يستقبل Request
- يستدعي Service
- يعيد Response

Service:
- يتحقق من قواعد العمل
- يجهز البيانات
- يتعامل مع Model
=====================================================
*/

/*
=====================================================
normalizeFeatures
=====================================================

تنظيف features القادمة من FormData.

تقبل:
- Object
- JSON String

وتعيد Object يحتوي Boolean فقط.
=====================================================
*/

const normalizeFeatures = (value) => {
  if (!value) {
    return {};
  }

  let features = value;

  if (typeof features === "string") {
    try {
      features = JSON.parse(features);
    } catch {
      throw new AppError("INVALID_TRIP_FEATURES", 400, "features");
    }
  }

  if (typeof features !== "object" || Array.isArray(features)) {
    throw new AppError("INVALID_TRIP_FEATURES", 400, "features");
  }

  return Object.fromEntries(
    Object.entries(features).filter(
      ([, featureValue]) => typeof featureValue === "boolean",
    ),
  );
};

/*
=====================================================
calculateLegacyDuration
=====================================================

مؤقت للتوافق مع النظام القديم.

لاحقًا:
التاريخ والتوقيت سينتقلان إلى TripDeparture.
=====================================================
*/

const calculateLegacyDuration = ({
  tripType,
  startDate,
  endDate,
  currentDuration,
}) => {
  if (!["tour", "package"].includes(tripType)) {
    return currentDuration;
  }

  if (!startDate || !endDate) {
    throw new AppError("TRIP_DATES_REQUIRED", 400, "startDate");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError("INVALID_TRIP_DATES", 400, "startDate");
  }

  if (end <= start) {
    throw new AppError("TRIP_END_BEFORE_START", 400, "endDate");
  }

  const diffTime = end.getTime() - start.getTime();

  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    days,
    nights: Math.max(days - 1, 0),
  };
};

/*
=====================================================
buildLegacyCapacity
=====================================================

هذه الدالة مؤقتة.

availableSeats لن يكون مصدر الحقيقة مستقبلًا.
Inventory سيصبح المسؤول عن المقاعد.

لكن نبقي السلوك الحالي حتى لا ينكسر النظام.
=====================================================
*/

const buildLegacyCapacity = (capacity = {}) => {
  const maxAdults = Number(capacity.maxAdults || 0);

  const maxChildren = Number(capacity.maxChildren || 0);

  const totalSeats = maxAdults + maxChildren;

  return {
    maxAdults,
    maxChildren,
    totalSeats,
    availableSeats: totalSeats,
  };
};

/*
=====================================================
validateTripClassification
=====================================================

يتأكد من علاقة:

type
+
subtype

Joi يتحقق منها أيضًا،
لكن Service يبقى خط الدفاع الخاص
بقواعد Business Domain.
=====================================================
*/

const validateTripClassification = ({ type, subtype }) => {
  if (!type || !subtype) {
    return;
  }

  if (!isTripSubtypeAllowed(type, subtype)) {
    throw new AppError(
      "INVALID_TRIP_SUBTYPE",
      400,
      "subtype",
      { subtype, type },
    );
  }
};

/*
=====================================================
prepareTripData
=====================================================

مكان مركزي لتجهيز بيانات Trip
للإنشاء والتحديث.

بهذا لا نكرر نفس المنطق بين:
createTrip
updateTrip
=====================================================
*/

const prepareTripData = ({ data, isUpdate = false }) => {
  const prepared = {
    ...data,
  };

  /*
  =====================
  Strings
  =====================
  */

  if (prepared.nameAr !== undefined) {
    prepared.nameAr = prepared.nameAr?.trim();
  }

  if (prepared.nameEn !== undefined) {
    prepared.nameEn = prepared.nameEn?.trim();
  }

  if (prepared.descriptionAr !== undefined) {
    prepared.descriptionAr = prepared.descriptionAr?.trim();
  }

  if (prepared.descriptionEn !== undefined) {
    prepared.descriptionEn = prepared.descriptionEn?.trim();
  }

  /*
  =====================
  Classification
  =====================
  */

  validateTripClassification({
    type: prepared.type,
    subtype: prepared.subtype,
  });

  /*
  =====================
  Features
  =====================
  */

  if (prepared.features !== undefined) {
    prepared.features = normalizeFeatures(prepared.features);
  }

  /*
  =====================
  Legacy Duration
  =====================
  */

  if (prepared.tripType !== undefined) {
    prepared.duration = calculateLegacyDuration({
      tripType: prepared.tripType,
      startDate: prepared.startDate,
      endDate: prepared.endDate,
      currentDuration: prepared.duration,
    });
  }

  /*
  =====================
  Legacy Capacity
  =====================
  */

  if (prepared.capacity !== undefined) {
    prepared.capacity = buildLegacyCapacity(prepared.capacity);
  }

  /*
  =====================
  endDate
  =====================

  Trip Model لا يخزن endDate حاليًا.

  نستخدمه فقط لحساب duration
  ثم نحذفه حتى لا يكون لدينا
  field وهمي.
  */

  delete prepared.endDate;

  /*
  حقول upload لا يجب أن تصل للModel.
  */

  delete prepared["imagesDeleted[]"];
  delete prepared["deletedImages[]"];

  if (!isUpdate && prepared.isActive === undefined) {
    prepared.isActive = true;
  }

  return prepared;
};

/*
=====================================================
getAllTrips
=====================================================
*/

export const getAllTripsService = async ({ query = {} } = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.max(Number(query.limit) || 10, 1);

  const skip = (page - 1) * limit;

  const filter = {
    isDeleted: false,
  };

  /*
    Legacy filter
    */

  if (query.tripType) {
    filter.tripType = query.tripType;
  }

  /*
    New filters
    */

  if (query.type) {
    filter.type = query.type;
  }

  if (query.scope) {
    filter.scope = query.scope;
  }

  if (query.subtype) {
    filter.subtype = query.subtype;
  }

  if (query.source) {
    filter.source = query.source;
  }

  if (query.isActive !== undefined && query.isActive !== "") {
    filter.isActive = String(query.isActive) === "true";
  }

  if (query.search) {
    const search = String(query.search).trim();

    if (search) {
      filter.$or = [
        {
          nameAr: {
            $regex: search,
            $options: "i",
          },
        },
        {
          nameEn: {
            $regex: search,
            $options: "i",
          },
        },
        {
          fromCity: {
            $regex: search,
            $options: "i",
          },
        },
        {
          toCity: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }
  }

  const addLocationFilter = (value, fields) => {
    const text = String(value || "").trim();
    if (!text) return;
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: fields.map((field) => ({
        [field]: { $regex: text, $options: "i" },
      })),
    });
  };

  addLocationFilter(query.origin, [
    "originAirport", "routeStops.location", "ports.location", "fromCity",
  ]);
  addLocationFilter(query.destination, [
    "destinationAirport", "routeStops.location", "ports.location", "toCity",
  ]);

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .populate("createdBy", "nameEn username")
      .populate("vehicleType", "nameEn nameAr")
      .populate("transportId", "nameEn nameAr")
      .populate("departuresCount")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit),

    Trip.countDocuments(filter),
  ]);

  return {
    trips,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/*
=====================================================
getTripById
=====================================================
*/

export const getTripByIdService = async (tripId) => {
  const trip = await Trip.findOne({
    _id: tripId,
    isDeleted: false,
  })
    .populate("createdBy", "nameEn username")
    .populate("vehicleType", "nameEn nameAr");
  if (trip) {
    await trip.populate("transportId", "nameEn nameAr");
    await trip.populate("departuresCount");
  }

  if (!trip) {
    throw new AppError("TRIP_NOT_FOUND", 404, "tripId", { id: tripId });
  }

  return trip;
};

/*
=====================================================
createTrip
=====================================================
*/

export const createTripService = async ({
  data,
  userId,
  images = [],
  req,
}) => {
  const prepared = prepareTripData({
    data,
    isUpdate: false,
  });

  const trip = await Trip.create({
    ...prepared,

    images,

    createdBy: userId,
  });

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.CREATE,
    entity: AUDIT_ENTITIES.TRIP,
    entityId: trip._id,
    before: null,
    after: trip.toObject(),
    metadata: {
      module: "trips",
    },
  });

  return trip;
};

/*
=====================================================
updateTrip
=====================================================
*/

export const updateTripService = async ({
  tripId,
  data,
  images,
  userId,
  req,
}) => {
  const trip = await Trip.findOne({
    _id: tripId,
    isDeleted: false,
  });

  if (!trip) {
    throw new AppError("TRIP_NOT_FOUND", 404, "tripId", { id: tripId });
  }

  const before = trip.toObject();

  const prepared = prepareTripData({
    data,
    isUpdate: true,
  });

  /*
    الصور يتم تجهيزها خارج هذه الدالة
    باستخدام utilities الموجودة بالمشروع.

    إذا وصل images النهائي،
    نستبدل قيمة الصور.
    */

  if (images !== undefined) {
    prepared.images = images;
  } else {
    delete prepared.images;
  }

  Object.assign(trip, prepared);
  trip.updatedBy = userId || null;

  await trip.save();

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.TRIP,
    entityId: trip._id,
    before,
    after: trip.toObject(),
    metadata: {
      module: "trips",
    },
  });

  return trip;
};

/*
=====================================================
deleteTrip
=====================================================
*/

export const deleteTripService = async ({ tripId, userId, req }) => {
  const trip = await Trip.findById(tripId);

  if (!trip) {
    throw new AppError("TRIP_NOT_FOUND", 404, "tripId", { id: tripId });
  }

  if (trip.isDeleted) {
    throw new AppError("TRIP_ALREADY_DELETED", 400, "tripId");
  }

  const hasDepartures = await TripDeparture.exists({
    tripId,
    isDeleted: false,
  });
  if (hasDepartures) {
    throw new AppError("TRIP_HAS_DEPARTURES", 409, "tripId");
  }

  const before = trip.toObject();
  const deletedTrip = await softDeleteDocument({
    document: trip,
    userId,
  });

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.DELETE,
    entity: AUDIT_ENTITIES.TRIP,
    entityId: deletedTrip._id,
    before,
    after: deletedTrip.toObject(),
    metadata: {
      module: "trips",
    },
  });

  return deletedTrip;
};

/*
=====================================================
restoreTrip
=====================================================
*/

export const restoreTripService = async ({ tripId, userId, req }) => {
  const trip = await Trip.findById(tripId);

  if (!trip) {
    throw new AppError("TRIP_NOT_FOUND", 404, "tripId", { id: tripId });
  }

  if (!trip.isDeleted) {
    throw new AppError("TRIP_NOT_DELETED", 400, "tripId");
  }

  const before = trip.toObject();
  const restoredTrip = await restoreDeletedDocument({ document: trip });

  restoredTrip.updatedBy = userId || null;
  await restoredTrip.save();

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.RESTORE,
    entity: AUDIT_ENTITIES.TRIP,
    entityId: restoredTrip._id,
    before,
    after: restoredTrip.toObject(),
    metadata: {
      module: "trips",
    },
  });

  return restoredTrip;
};

/*
=====================================================
toggleTripStatus
=====================================================
*/

export const toggleTripStatusService = async ({ tripId, userId, req }) => {
  const trip = await Trip.findOne({
    _id: tripId,
    isDeleted: false,
  });

  if (!trip) {
    throw new AppError("TRIP_NOT_FOUND", 404, "tripId", { id: tripId });
  }

  const before = trip.toObject();

  trip.isActive = !trip.isActive;
  trip.updatedBy = userId || null;

  await trip.save();

  await createAuditLog({
    req,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: AUDIT_ENTITIES.TRIP,
    entityId: trip._id,
    before,
    after: trip.toObject(),
    metadata: {
      module: "trips",
      isActive: trip.isActive,
    },
  });

  return trip;
};
