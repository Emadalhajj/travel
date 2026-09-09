import Trip from "../../models/transportition/trip-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import Inventory from "../../models/inventory-model.js";
import mongoose from "mongoose";

import AppError from "../../utils/AppError.js";

import { buildPagination } from "../../utils/Builders/buildPagination.js";

import {
  softDeleteDocument,
  restoreDeletedDocument,
} from "../../utils/softDelete.js";

import { createAuditLog } from "../audit/audit-log-service.js";

import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";

import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";

import { TRIP_SOURCES } from "../../constants/trips/trip.constants.js";
import {
  TRIP_DEPARTURE_STATUS,
  canTransitionTripDepartureStatus,
} from "../../constants/trips/trip-departure.constants.js";
import { INVENTORY_TYPES } from "../../constants/inventory/inventory-types.js";
import {
  getSingleInventoryState,
  moveSingleInventoryDate,
  setSingleInventoryActive,
  syncSingleInventoryCapacity,
} from "../booking/inventory-service.js";

const runInTransaction = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const assertTransition = (fromStatus, toStatus) => {
  if (!canTransitionTripDepartureStatus(fromStatus, toStatus)) {
    throw new AppError("TRIP_DEPARTURE_TRANSITION_INVALID", 409, "status");
  }
};

const auditLifecycle = ({ req, departure, action, metadata }) =>
  createAuditLog({
    req,
    action,
    entity: AUDIT_ENTITIES.TRIP_DEPARTURE,
    entityId: departure._id,
    before: null,
    after: null,
    metadata: { module: "trip-departures", ...metadata },
  });

/*
=====================================================
validateTrip
=====================================================

يتأكد أن Trip المرتبط:

- موجود
- غير محذوف
- فعال عند الحاجة

لا نضع هذه القاعدة في Joi لأن Joi
لا يصل إلى MongoDB.
=====================================================
*/

const validateTrip = async (tripId, session = null) => {
  const query = Trip.findOne({
    _id: tripId,
    isDeleted: { $ne: true },
  });
  if (session) query.session(session);
  const trip = await query;

  if (!trip) {
    throw new AppError("TRIP_NOT_FOUND", 404, "tripId", { id: tripId });
  }

  return trip;
};

/*
=====================================================
validateDepartureDates
وظيفة هذه الدالة التحقق من صحة تواريخ المغادرة والوصول.
- يجب أن يكون تاريخ المغادرة موجودًا وصالحًا.
- إذا كان تاريخ الوصول موجودًا، يجب أن يكون صالحًا ويأتي بعد تاريخ المغادرة.
=====================================================
*/

const validateDepartureDates = ({ departureAt, arrivalAt }) => {
  if (!departureAt) {
    throw new AppError("TRIP_DEPARTURE_DATE_REQUIRED", 400, "departureAt");
  }

  const departureDate = new Date(departureAt); // تحويل تاريخ المغادرة إلى كائن Date

  if (Number.isNaN(departureDate.getTime())) {
    // التحقق من صحة تاريخ المغادرة
    throw new AppError("TRIP_DEPARTURE_DATE_INVALID", 400, "departureAt");
  }

  if (!arrivalAt) {
    return;
  }

  const arrivalDate = new Date(arrivalAt);

  if (Number.isNaN(arrivalDate.getTime())) {
    throw new AppError("TRIP_ARRIVAL_DATE_INVALID", 400, "arrivalAt");
  }

  if (arrivalDate <= departureDate) {
    throw new AppError("TRIP_ARRIVAL_BEFORE_DEPARTURE", 400, "arrivalAt");
  }
};

/*
=====================================================
normalizeSegments
=====================================================

ترتيب segments وتوحيد sequence.

لا نعتمد على sequence القادمة من Frontend
كمصدر نهائي.

ترتيب Array هو المصدر الأساسي.
=====================================================
*/

const normalizeSegments = (segments = []) => {
  //
  if (!Array.isArray(segments)) {
    return [];
  }

  return segments.map((segment, index) => ({
    ...segment,

    sequence: index + 1,
  }));
};

const getRoutePointName = (point) =>
  typeof point === "string" ? point : point?.location || point?.name || "";

const getTripRoutePoints = (trip) => {
  let points = [];

  if (trip?.type === "AIR") {
    points = [trip.originAirport, trip.destinationAirport];
  } else if (trip?.type === "SEA") {
    points = trip.ports || [];
  } else if (trip?.type === "LAND") {
    points = trip.routeStops || [];
  }

  const normalized = points.map(getRoutePointName).filter(Boolean);
  return normalized.length >= 2
    ? normalized
    : [trip?.fromCity, trip?.toCity].filter(Boolean);
};

const alignSegmentsWithTripRoute = (trip, segments = []) => {
  const points = getTripRoutePoints(trip);
  const submitted = Array.isArray(segments) ? segments : [];

  // مسار الرحلة الجوية المتصلة يأتي من المزود كمقاطع تشغيلية
  // فعلية، ولا يجوز اختصاره إلى origin/destination فقط.
  if (trip?.type === "AIR" && submitted.length > 1) {
    return normalizeSegments(submitted);
  }

  if (points.length < 2) return normalizeSegments(segments);

  return points.slice(0, -1).map((from, index) => ({
    ...(submitted[index] || {}),
    from,
    to: points[index + 1],
    sequence: index + 1,
  }));
};

/*
=====================================================
validateSegments
=====================================================
 
يتحقق من:

1. departureAt <= arrivalAt داخل كل segment
2. عدم بدء segment قبل انتهاء السابق
=====================================================
*/

const validateSegments = (segments = []) => {
  if (!segments.length) {
    return;
  }

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];

    const departureAt = segment.departureAt
      ? new Date(segment.departureAt)
      : null;

    const arrivalAt = segment.arrivalAt ? new Date(segment.arrivalAt) : null;

    if (departureAt && Number.isNaN(departureAt.getTime())) {
      throw new AppError("TRIP_SEGMENT_DEPARTURE_INVALID", 400, "segments", {
        index: index + 1,
      });
    }

    if (arrivalAt && Number.isNaN(arrivalAt.getTime())) {
      throw new AppError("TRIP_SEGMENT_ARRIVAL_INVALID", 400, "segments", {
        index: index + 1,
      });
    }

    if (departureAt && arrivalAt && arrivalAt <= departureAt) {
      throw new AppError(
        "TRIP_SEGMENT_ARRIVAL_BEFORE_DEPARTURE",
        400,
        "segments",
        { index: index + 1 },
      );
    }

    if (index === 0) {
      continue;
    }

    const previousSegment = segments[index - 1];

    if (!previousSegment.arrivalAt || !segment.departureAt) {
      continue;
    }

    const previousArrival = new Date(previousSegment.arrivalAt);

    const currentDeparture = new Date(segment.departureAt);

    if (currentDeparture < previousArrival) {
      throw new AppError("TRIP_SEGMENT_OVERLAP", 400, "segments", {
        index: index + 1,
      });
    }
  }
};

/*
=====================================================
validateProviderData
=====================================================

إذا كان Departure قادمًا من API
يجب معرفة مصدره الخارجي.

لا نخزن raw provider payload هنا.
=====================================================
*/

const validateProviderData = ({ source, providerId, externalId }) => {
  if (source !== TRIP_SOURCES.API) {
    return;
  }

  if (!providerId?.trim()) {
    throw new AppError("TRIP_PROVIDER_REQUIRED", 400, "providerId");
  }

  if (!externalId?.trim()) {
    throw new AppError("TRIP_EXTERNAL_ID_REQUIRED", 400, "externalId");
  }
};

/*
=====================================================
validateDepartureAgainstSegments
=====================================================

إذا كانت هناك Segments:

departureAt الرئيسي لا يجب أن يكون
بعد أول Segment.

arrivalAt الرئيسي لا يجب أن يكون
قبل آخر Segment.

=====================================================
*/

const validateDepartureAgainstSegments = ({
  departureAt,
  arrivalAt,
  segments,
}) => {
  if (!segments?.length) {
    return;
  }

  const firstSegment = segments[0];

  const lastSegment = segments[segments.length - 1];

  if (departureAt && firstSegment.departureAt) {
    const mainDeparture = new Date(departureAt);

    const firstDeparture = new Date(firstSegment.departureAt);

    if (mainDeparture > firstDeparture) {
      throw new AppError(
        "TRIP_MAIN_DEPARTURE_AFTER_FIRST_SEGMENT",
        400,
        "departureAt",
      );
    }
  }

  if (arrivalAt && lastSegment.arrivalAt) {
    const mainArrival = new Date(arrivalAt);

    const lastArrival = new Date(lastSegment.arrivalAt);

    if (mainArrival < lastArrival) {
      throw new AppError(
        "TRIP_MAIN_ARRIVAL_BEFORE_LAST_SEGMENT",
        400,
        "arrivalAt",
      );
    }
  }
};

/*
=====================================================
prepareDepartureData
=====================================================

تجهيز الحالة النهائية قبل الحفظ.

مهم:
هذه دالة Domain داخلية وليست Utility عامة.
=====================================================
*/

const prepareDepartureData = ({ data }) => {
  const prepared = {
    ...data,
  };

  if (Object.prototype.hasOwnProperty.call(prepared, "segments")) {
    prepared.segments = normalizeSegments(prepared.segments);
  }

  validateDepartureDates({
    departureAt: prepared.departureAt,

    arrivalAt: prepared.arrivalAt,
  });

  validateSegments(prepared.segments || []);

  validateProviderData({
    source: prepared.source,

    providerId: prepared.providerId,

    externalId: prepared.externalId,
  });

  validateDepartureAgainstSegments({
    departureAt: prepared.departureAt,

    arrivalAt: prepared.arrivalAt,

    segments: prepared.segments || [],
  });

  return prepared;
};

/*
=====================================================
createTripDepartureService
=====================================================
*/

export const createTripDepartureService = async ({ data, userId, req, session = null }) => {
  if (
    data.status !== undefined &&
    data.status !== TRIP_DEPARTURE_STATUS.DRAFT
  ) {
    throw new AppError(
      "TRIP_DEPARTURE_STATUS_UPDATE_FORBIDDEN",
      400,
      "status",
    );
  }

  const trip = await validateTrip(data.tripId, session);

  const preparedData = prepareDepartureData({
    data: {
      ...data,
      segments: alignSegmentsWithTripRoute(trip, data.segments),
    },
  });

  const departureData = {
    ...preparedData,

    status: TRIP_DEPARTURE_STATUS.DRAFT,

    createdBy: userId || null,
  };

  const created = session
    ? await TripDeparture.create([departureData], { session })
    : await TripDeparture.create(departureData);
  const departure = Array.isArray(created) ? created[0] : created;

  await createAuditLog({
    req,

    action: AUDIT_ACTIONS.CREATE,

    entity: AUDIT_ENTITIES.TRIP_DEPARTURE,

    entityId: departure._id,

    before: null,

    after: departure.toObject(),

    metadata: {
      module: "trip-departures",

      tripId: departure.tripId,
    },
    session,
  });

  return departure;
};

/*
=====================================================
getTripDepartureByIdService
=====================================================
*/

export const getTripDepartureByIdService = async (departureId) => {
  const departure = await TripDeparture.findOne({
    _id: departureId,
    isDeleted: false,
  })
    .populate("tripId", "nameAr nameEn type scope subtype source isActive")
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role")
    .populate("segments.transportId");

  if (!departure) {
    throw new AppError("TRIP_DEPARTURE_NOT_FOUND", 404, "tripDeparture", {
      id: departureId,
    });
  }

  return departure;
};

/*
=====================================================
getAllTripDeparturesService
=====================================================
*/

export const getAllTripDeparturesService = async ({ query = {} }) => {
  const { page, limit, skip } = buildPagination(query);

  const filter = {
    isDeleted: false,
  };

  if (query.tripId) {
    filter.tripId = query.tripId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.source) {
    filter.source = query.source;
  }

  if (query.isActive !== undefined) {
    filter.isActive = String(query.isActive) === "true";
  }

  /*
    ================================================
    Date Range
    ================================================
    */

  if (query.startDate || query.endDate) {
    filter.departureAt = {};

    if (query.startDate) {
      filter.departureAt.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);

      /*
        إذا كان التاريخ فقط:
        نغطي اليوم كاملًا.
        */

      endDate.setHours(23, 59, 59, 999);

      filter.departureAt.$lte = endDate;
    }
  }

  if (query.providerId) {
    filter.providerId = query.providerId;
  }

  if (query.externalId) {
    filter.externalId = query.externalId;
  }

  const [departures, total] = await Promise.all([
    TripDeparture.find(filter)
      .populate("tripId", "nameAr nameEn type scope subtype source isActive")
      .populate("inventory", "total reserved blocked available isActive date")
      .sort({
        departureAt: 1,
      })
      .skip(skip)
      .limit(limit),

    TripDeparture.countDocuments(filter),
  ]);

  return {
    departures,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/*
=====================================================
updateTripDepartureService
=====================================================

مهم جدًا:

لا نتحقق فقط من payload.

نقوم أولًا ببناء Final State:

existing
+
update payload

ثم نتحقق من الحالة النهائية.

هذا يحل مشاكل PATCH.
=====================================================
*/

export const updateTripDepartureService = async ({
  departureId,
  data,
  userId,
  req,
}) => {
  if (Object.hasOwn(data, "status")) {
    throw new AppError(
      "TRIP_DEPARTURE_STATUS_UPDATE_FORBIDDEN",
      400,
      "status",
    );
  }

  const departure = await TripDeparture.findOne({
    _id: departureId,
    isDeleted: false,
  });

  if (!departure) {
    throw new AppError("TRIP_DEPARTURE_NOT_FOUND", 404, "tripDeparture", {
      id: departureId,
    });
  }

  /*
    إذا تم تغيير Trip
    نتأكد من وجود الجديد.
    */

  const tripChanged = data.tripId && String(data.tripId) !== String(departure.tripId);

  /*
    ================================================
    Merge nested fields
    ================================================

    لا نستخدم shallow merge فقط مع pricing/capacity.
    */

  const current = departure.toObject();

  const nextState = {
    ...current,
    ...data,

    pricing: {
      ...current.pricing,
      ...(data.pricing || {}),
    },

    capacity: {
      ...current.capacity,
      ...(data.capacity || {}),
    },

    segments: data.segments !== undefined ? data.segments : current.segments,
  };

  const trip = await validateTrip(nextState.tripId);
  nextState.segments = alignSegmentsWithTripRoute(trip, nextState.segments);

  const preparedData = prepareDepartureData({
    data: nextState,
  });

  /*
    لا نريد تمرير Mongo internal fields
    مرة أخرى إلى Object.assign.
    */

  const updateData = {
    ...data,
  };

  if (data.pricing !== undefined) {
    updateData.pricing = preparedData.pricing;
  }

  if (data.capacity !== undefined) {
    updateData.capacity = preparedData.capacity;
  }

  if (data.segments !== undefined || tripChanged) {
    updateData.segments = preparedData.segments;
  }

  const isScheduled = departure.status === TRIP_DEPARTURE_STATUS.SCHEDULED;
  const previousDepartureAt = new Date(current.departureAt);
  const nextDepartureAt = new Date(preparedData.departureAt);
  const dateChanged = previousDepartureAt.getTime() !== nextDepartureAt.getTime();
  const previousCapacity = Number(current.capacity?.totalSeats || 0);
  const nextCapacity = Number(preparedData.capacity?.totalSeats || 0);
  const capacityChanged = previousCapacity !== nextCapacity;

  const saveDeparture = async (session = null) => {
    Object.assign(departure, updateData);
    departure.updatedBy = userId || null;
    await departure.save(session ? { session } : undefined);
    return departure;
  };

  if (isScheduled && (dateChanged || capacityChanged)) {
    if (nextDepartureAt <= new Date()) {
      throw new AppError("TRIP_DEPARTURE_PAST", 400, "departureAt");
    }

    await runInTransaction(async (session) => {
      if (dateChanged) {
        await moveSingleInventoryDate({
          Inventory,
          inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
          itemId: departure._id,
          fromDate: previousDepartureAt,
          toDate: nextDepartureAt,
          userId,
          session,
        });
      }

      await syncSingleInventoryCapacity({
        Inventory,
        inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
        itemId: departure._id,
        date: nextDepartureAt,
        total: nextCapacity,
        isActive: departure.isActive,
        userId,
        session,
      });

      await saveDeparture(session);
    });
  } else {
    await saveDeparture();
  }

  await createAuditLog({
    req,

    action: AUDIT_ACTIONS.UPDATE,

    entity: AUDIT_ENTITIES.TRIP_DEPARTURE,

    entityId: departure._id,

    before: null,

    after: null,

    metadata: {
      module: "trip-departures",

      tripId: departure.tripId,
      ...(dateChanged
        ? {
            previousDepartureAt,
            departureAt: nextDepartureAt,
          }
        : {}),
      ...(capacityChanged
        ? { previousCapacity, capacity: nextCapacity }
        : {}),
    },
  });

  return departure;
};

export const scheduleTripDepartureService = async ({
  departureId,
  userId,
  req,
}) => {
  const departure = await TripDeparture.findOne({
    _id: departureId,
    isDeleted: false,
  });
  if (!departure) {
    throw new AppError("TRIP_DEPARTURE_NOT_FOUND", 404, "tripDeparture", {
      id: departureId,
    });
  }

  assertTransition(departure.status, TRIP_DEPARTURE_STATUS.SCHEDULED);
  const parentTrip = await validateTrip(departure.tripId);
  if (!parentTrip.isActive) {
    throw new AppError("TRIP_NOT_FOUND", 404, "tripId", { id: departure.tripId });
  }
  const total = Number(departure.capacity?.totalSeats || 0);
  if (!Number.isFinite(total) || total <= 0) {
    throw new AppError(
      "TRIP_DEPARTURE_CAPACITY_REQUIRED",
      400,
      "capacity.totalSeats",
    );
  }
  if (new Date(departure.departureAt) <= new Date()) {
    throw new AppError("TRIP_DEPARTURE_PAST", 400, "departureAt");
  }

  const fromStatus = departure.status;
  await runInTransaction(async (session) => {
    await syncSingleInventoryCapacity({
      Inventory,
      inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
      itemId: departure._id,
      date: departure.departureAt,
      total,
      isActive: true,
      userId,
      session,
    });
    departure.status = TRIP_DEPARTURE_STATUS.SCHEDULED;
    departure.isActive = true;
    departure.updatedBy = userId || null;
    await departure.save({ session });
  });

  if (fromStatus !== departure.status) {
    await auditLifecycle({
      req,
      departure,
      action: AUDIT_ACTIONS.STATUS_CHANGE,
      metadata: { fromStatus, toStatus: departure.status },
    });
  }
  return departure;
};

export const cancelTripDepartureService = async ({
  departureId,
  userId,
  req,
}) => {
  const departure = await TripDeparture.findOne({
    _id: departureId,
    isDeleted: false,
  });
  if (!departure) {
    throw new AppError("TRIP_DEPARTURE_NOT_FOUND", 404, "tripDeparture", {
      id: departureId,
    });
  }
  assertTransition(departure.status, TRIP_DEPARTURE_STATUS.CANCELLED);
  const fromStatus = departure.status;

  await runInTransaction(async (session) => {
    if (fromStatus === TRIP_DEPARTURE_STATUS.SCHEDULED) {
      const state = await getSingleInventoryState({
        Inventory,
        inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
        itemId: departure._id,
        date: departure.departureAt,
        session,
      });
      if (Number(state?.reserved || 0) + Number(state?.blocked || 0) > 0) {
        throw new AppError("TRIP_DEPARTURE_CONSUMED", 409, "departure");
      }
      await setSingleInventoryActive({
        Inventory,
        inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
        itemId: departure._id,
        date: departure.departureAt,
        isActive: false,
        userId,
        session,
      });
    }
    departure.status = TRIP_DEPARTURE_STATUS.CANCELLED;
    departure.isActive = false;
    departure.updatedBy = userId || null;
    await departure.save({ session });
  });

  await auditLifecycle({
    req,
    departure,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    metadata: { fromStatus, toStatus: departure.status },
  });
  return departure;
};

export const completeTripDepartureService = async ({
  departureId,
  userId,
  req,
}) => {
  const departure = await TripDeparture.findOne({
    _id: departureId,
    isDeleted: false,
  });
  if (!departure) {
    throw new AppError("TRIP_DEPARTURE_NOT_FOUND", 404, "tripDeparture", {
      id: departureId,
    });
  }
  assertTransition(departure.status, TRIP_DEPARTURE_STATUS.COMPLETED);
  const fromStatus = departure.status;

  await runInTransaction(async (session) => {
    await setSingleInventoryActive({
      Inventory,
      inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
      itemId: departure._id,
      date: departure.departureAt,
      isActive: false,
      userId,
      session,
    });
    departure.status = TRIP_DEPARTURE_STATUS.COMPLETED;
    departure.isActive = false;
    departure.updatedBy = userId || null;
    await departure.save({ session });
  });

  await auditLifecycle({
    req,
    departure,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    metadata: { fromStatus, toStatus: departure.status },
  });
  return departure;
};

/*
=====================================================
toggleTripDepartureActiveService
=====================================================

هذه الدالة تغير isActive فقط.

لا تغير status التشغيلي.
=====================================================
*/

export const toggleTripDepartureActiveService = async ({
  departureId,
  userId,
  req,
}) => {
  const departure = await TripDeparture.findOne({
    _id: departureId,
    isDeleted: false,
  });

  if (!departure) {
    throw new AppError("TRIP_DEPARTURE_NOT_FOUND", 404, "tripDeparture", {
      id: departureId,
    });
  }

  const nextActive = !departure.isActive;
  if (
    nextActive &&
    [
      TRIP_DEPARTURE_STATUS.CANCELLED,
      TRIP_DEPARTURE_STATUS.COMPLETED,
    ].includes(departure.status)
  ) {
    throw new AppError(
      "TRIP_DEPARTURE_REACTIVATE_FORBIDDEN",
      409,
      "isActive",
    );
  }

  if (departure.status === TRIP_DEPARTURE_STATUS.SCHEDULED) {
    await runInTransaction(async (session) => {
      await setSingleInventoryActive({
        Inventory,
        inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
        itemId: departure._id,
        date: departure.departureAt,
        isActive: nextActive,
        userId,
        session,
      });
      departure.isActive = nextActive;
      departure.updatedBy = userId || null;
      await departure.save({ session });
    });
  } else {
    departure.isActive = nextActive;
    departure.updatedBy = userId || null;
    await departure.save();
  }

  await createAuditLog({
    req,

    action: AUDIT_ACTIONS.STATUS_CHANGE,

    entity: AUDIT_ENTITIES.TRIP_DEPARTURE,

    entityId: departure._id,

    before: null,

    after: null,

    metadata: {
      module: "trip-departures",

      field: "isActive",

      isActive: departure.isActive,
    },
  });

  return departure;
};

/*
=====================================================
deleteTripDepartureService
=====================================================
*/

export const deleteTripDepartureService = async ({
  departureId,
  userId,
  req,
}) => {
  const departure = await TripDeparture.findById(departureId);

  if (!departure) {
    throw new AppError("TRIP_DEPARTURE_NOT_FOUND", 404, "tripDeparture", {
      id: departureId,
    });
  }

  if (departure.isDeleted) {
    throw new AppError("TRIP_DEPARTURE_ALREADY_DELETED", 400, "tripDeparture");
  }

  const before = departure.toObject();

  const deletedDeparture = await softDeleteDocument({
    document: departure,

    userId,
  });

  await createAuditLog({
    req,

    action: AUDIT_ACTIONS.DELETE,

    entity: AUDIT_ENTITIES.TRIP_DEPARTURE,

    entityId: deletedDeparture._id,

    before,

    after: deletedDeparture.toObject(),

    metadata: {
      module: "trip-departures",

      tripId: deletedDeparture.tripId,
    },
  });

  return deletedDeparture;
};

/*
=====================================================
restoreTripDepartureService
=====================================================
*/

export const restoreTripDepartureService = async ({
  departureId,
  userId,
  req,
}) => {
  const departure = await TripDeparture.findById(departureId);

  if (!departure) {
    throw new AppError("TRIP_DEPARTURE_NOT_FOUND", 404, "tripDeparture", {
      id: departureId,
    });
  }

  if (!departure.isDeleted) {
    throw new AppError("TRIP_DEPARTURE_NOT_DELETED", 400, "tripDeparture");
  }

  /*
    لا نسترجع Departure
    إذا Trip نفسه محذوف.
    */

  await validateTrip(departure.tripId);

  const before = departure.toObject();

  const restoredDeparture = await restoreDeletedDocument({
    document: departure,
  });

  restoredDeparture.updatedBy = userId || null;

  await restoredDeparture.save();

  await createAuditLog({
    req,

    action: AUDIT_ACTIONS.RESTORE,

    entity: AUDIT_ENTITIES.TRIP_DEPARTURE,

    entityId: restoredDeparture._id,

    before,

    after: restoredDeparture.toObject(),

    metadata: {
      module: "trip-departures",

      tripId: restoredDeparture.tripId,
    },
  });

  return restoredDeparture;
};
