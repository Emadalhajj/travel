import { INVENTORY_HOLD_STATUSES } from "../../../constants/inventory/inventory-hold-statuses.js";

export const LEGACY_TRIP_TYPE_MAP = Object.freeze({
  transport: { type: "LAND", subtype: "TRANSPORT" },
  tour: { type: "LAND", subtype: "TOUR" },
  activity: { type: "LAND", subtype: "ACTIVITY" },
});

export const migrationKeyForTrip = (tripId) => `legacy-trip:${tripId}`;

const validDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const legacyCapacity = (trip = {}) =>
  Number(trip.capacity?.totalSeats || 0) ||
  Number(trip.capacity?.maxAdults || 0) + Number(trip.capacity?.maxChildren || 0);

export const classifyLegacyTrip = (trip = {}) => {
  if (trip.type && trip.subtype && !trip.tripType) {
    return { status: "ALREADY_MIGRATED", reason: "New classification exists" };
  }
  if (trip.tripType === "package") {
    return { status: "MANUAL_REVIEW", reason: "Legacy package cannot be safely mapped" };
  }
  const mapping = LEGACY_TRIP_TYPE_MAP[trip.tripType];
  if (!mapping) {
    return { status: "UNMAPPABLE", reason: "Unknown legacy trip type" };
  }
  if (!validDate(trip.startDate) || legacyCapacity(trip) <= 0) {
    return {
      status: "MANUAL_REVIEW",
      reason: "Reliable departure date and positive capacity are required",
    };
  }
  return { status: "AUTO_MAPPABLE", mapping };
};

export const buildLegacyMigrationPlan = ({ trip, inventoryRows = [], now = new Date() }) => {
  const classification = classifyLegacyTrip(trip);
  if (classification.status !== "AUTO_MAPPABLE") return { trip, classification };
  if (inventoryRows.length > 1) {
    return {
      trip,
      classification: {
        status: "MANUAL_REVIEW",
        reason: "Multiple legacy inventory rows cannot map to one departure safely",
      },
    };
  }

  const legacyInventory = inventoryRows[0] || null;
  const total = Number(legacyInventory?.total ?? legacyCapacity(trip));
  const reserved = Number(legacyInventory?.reserved || 0);
  const blocked = Number(legacyInventory?.blocked || 0);
  if (total < 0 || reserved < 0 || blocked < 0 || reserved + blocked > total) {
    return {
      trip,
      classification: { status: "INVENTORY_INCONSISTENT", reason: "Invalid inventory counters" },
    };
  }

  const departureAt = validDate(trip.startDate);
  const durationDays = Math.max(Number(trip.duration?.days || 1), 1);
  const arrivalAt = new Date(departureAt.getTime() + durationDays * 86400000);
  const isFuture = departureAt > now;

  return {
    trip,
    classification,
    departure: {
      tripId: trip._id,
      departureAt,
      arrivalAt,
      status: isFuture && trip.isActive !== false ? "SCHEDULED" : "COMPLETED",
      source: "MANUAL",
      pricing: {
        basePrice: Number(trip.pricing?.basePrice || 0),
        discountPrice: Number(trip.pricing?.discountPrice || 0),
        currency: trip.pricing?.currency || "SAR",
      },
      capacity: { totalSeats: total },
      isActive: isFuture && trip.isActive !== false,
      migration: {
        key: migrationKeyForTrip(trip._id),
        legacyTripId: trip._id,
        migratedAt: now,
      },
    },
    inventory: {
      total,
      reserved,
      blocked,
      available: total - reserved - blocked,
      isActive: isFuture && trip.isActive !== false,
      isDeleted: false,
    },
  };
};

export const auditLegacyTrips = async (db) => {
  const [trips, migratedDepartures, legacyInventories, drafts, bookings, activeLegacyHolds] = await Promise.all([
    db.collection("trips").find({
      $or: [
        { tripType: { $exists: true, $ne: null } },
        { startDate: { $ne: null } },
        { "capacity.availableSeats": { $exists: true } },
      ],
    }).toArray(),
    db.collection("tripdepartures").find({ "migration.key": /^legacy-trip:/ }).toArray(),
    db.collection("inventories").find({ inventoryType: "trip" }).toArray(),
    db.collection("draftbookings").find({
      $or: [
        { "trip.tripId": { $ne: null }, "trip.departureId": null },
        { "data.selectedProducts.departureId": { $exists: true }, "trip.departureId": null },
      ],
    }).toArray(),
    db.collection("bookings").find({
      $or: [
        { trip: { $ne: null }, tripDeparture: null },
        { "bookingItems.trip.tripId": { $ne: null }, "bookingItems.trip.departureId": null },
      ],
    }).toArray(),
    db.collection("inventoryholds").find({
      isActive: true,
      status: { $nin: [
        INVENTORY_HOLD_STATUSES.COMMITTED,
        INVENTORY_HOLD_STATUSES.RELEASED,
        INVENTORY_HOLD_STATUSES.EXPIRED,
      ] },
      inventoryReservations: { $elemMatch: { inventoryType: "trip" } },
    }).toArray(),
  ]);

  const inventoryByTrip = new Map();
  for (const row of legacyInventories) {
    const key = String(row.itemId);
    inventoryByTrip.set(key, [...(inventoryByTrip.get(key) || []), row]);
  }
  const migratedTripIds = new Set(
    migratedDepartures.map(({ migration }) => String(migration?.legacyTripId || "")),
  );
  const classifications = trips.map((trip) => {
    if (migratedTripIds.has(String(trip._id))) {
      return {
        trip,
        classification: {
          status: "ALREADY_MIGRATED",
          reason: "Deterministic migration departure already exists",
        },
      };
    }
    return buildLegacyMigrationPlan({
      trip,
      inventoryRows: inventoryByTrip.get(String(trip._id)) || [],
    });
  });

  return {
    counts: {
      legacyTrips: trips.length,
      legacyTripInventories: legacyInventories.length,
      draftsMissingDepartureId: drafts.length,
      bookingsMissingTripDeparture: bookings.length,
      activeLegacyHolds: activeLegacyHolds.length,
      autoMappable: classifications.filter((x) => x.classification.status === "AUTO_MAPPABLE").length,
      alreadyMigrated: classifications.filter((x) => x.classification.status === "ALREADY_MIGRATED").length,
      manualReview: classifications.filter((x) => x.classification.status === "MANUAL_REVIEW").length,
      unmappable: classifications.filter((x) => x.classification.status === "UNMAPPABLE").length,
      inconsistentInventory: classifications.filter((x) => x.classification.status === "INVENTORY_INCONSISTENT").length,
    },
    classifications,
    drafts,
    bookings,
    activeLegacyHolds,
  };
};

export const migrateLegacyTrips = async (db, { execute = false, now = new Date() } = {}) => {
  const audit = await auditLegacyTrips(db);
  if (execute && audit.counts.activeLegacyHolds > 0) {
    throw new Error("Migration blocked: active legacy trip holds must be zero");
  }

  const result = { execute, migrated: 0, draftsBackfilled: 0, skipped: 0 };
  for (const plan of audit.classifications) {
    if (plan.classification.status !== "AUTO_MAPPABLE") {
      result.skipped += 1;
      continue;
    }
    if (!execute) {
      result.migrated += 1;
      continue;
    }

    const departureResult = await db.collection("tripdepartures").findOneAndUpdate(
      { "migration.key": migrationKeyForTrip(plan.trip._id) },
      { $setOnInsert: { ...plan.departure, createdAt: now }, $set: { updatedAt: now } },
      { upsert: true, returnDocument: "after" },
    );
    const departure = departureResult?.value || departureResult;
    const departureId = departure?._id;
    if (!departureId) throw new Error(`Unable to resolve migrated departure for ${plan.trip._id}`);

    await db.collection("trips").updateOne(
      { _id: plan.trip._id },
      { $set: { ...plan.classification.mapping, updatedAt: now } },
    );
    await db.collection("inventories").updateOne(
      { inventoryType: "tripDeparture", itemId: departureId, date: plan.departure.departureAt },
      { $setOnInsert: { createdAt: now }, $set: { ...plan.inventory, updatedAt: now } },
      { upsert: true },
    );
    result.migrated += 1;
  }

  if (execute) {
    const legacyDrafts = await db.collection("draftbookings").find({
      "trip.departureId": null,
      "data.selectedProducts.departureId": { $exists: true },
    }).toArray();
    for (const draft of legacyDrafts) {
      const product = (draft.data?.selectedProducts || []).find((item) => item?.departureId);
      if (!product?.tripId) continue;
      const departure = await db.collection("tripdepartures").findOne({
        _id: product.departureId,
        tripId: product.tripId,
      });
      if (!departure) continue;
      await db.collection("draftbookings").updateOne(
        { _id: draft._id, "trip.departureId": null },
        { $set: {
          trip: {
            tripId: departure.tripId,
            departureId: departure._id,
            departureAt: departure.departureAt,
            arrivalAt: departure.arrivalAt || null,
            quantity: Number(product.quantity || 1),
            chargeType: product.chargeType || "PER_TRAVELER",
            unitPrice: Number(departure.pricing?.discountPrice || departure.pricing?.basePrice || 0),
            currency: departure.pricing?.currency || "SAR",
          },
          updatedAt: now,
        } },
      );
      result.draftsBackfilled += 1;
    }
  }
  return { ...result, audit: audit.counts };
};

export const verifyTripMigration = async (db) => {
  const issues = [];
  const departures = await db.collection("tripdepartures").find({
    "migration.key": /^legacy-trip:/,
  }).toArray();

  for (const departure of departures) {
    const trip = await db.collection("trips").findOne({ _id: departure.tripId });
    if (!trip) issues.push({ code: "ORPHAN_DEPARTURE", departureId: departure._id });
    const inventories = await db.collection("inventories").find({
      inventoryType: "tripDeparture",
      itemId: departure._id,
      date: departure.departureAt,
      isDeleted: { $ne: true },
    }).toArray();
    if (inventories.length !== 1) {
      issues.push({ code: "INVENTORY_CARDINALITY", departureId: departure._id, count: inventories.length });
      continue;
    }
    const inventory = inventories[0];
    const expected = Number(inventory.total) - Number(inventory.reserved) - Number(inventory.blocked);
    if (expected < 0 || Number(inventory.available) !== expected) {
      issues.push({ code: "INVENTORY_COUNTER_MISMATCH", inventoryId: inventory._id });
    }
  }

  const activeLegacyHolds = await db.collection("inventoryholds").countDocuments({
    isActive: true,
    inventoryReservations: { $elemMatch: { inventoryType: "trip" } },
  });
  if (activeLegacyHolds) issues.push({ code: "ACTIVE_LEGACY_HOLDS", count: activeLegacyHolds });

  return { ok: issues.length === 0, checkedDepartures: departures.length, issues };
};
