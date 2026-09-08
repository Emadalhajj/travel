import test from "node:test";
import assert from "node:assert/strict";

import AuditLog from "../../models/audit/audit-log-model.js";
import Trip from "../../models/transportition/trip-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";
import {
  createTripDepartureService,
  deleteTripDepartureService,
  getAllTripDeparturesService,
  getTripDepartureByIdService,
  restoreTripDepartureService,
  toggleTripDepartureActiveService,
  updateTripDepartureService,
} from "../../services/trips/trip-departure-service.js";

const tripId = "64b000000000000000000001";
const departureId = "64b000000000000000000002";
const userId = "64b000000000000000000003";

const request = {
  user: { _id: userId },
  headers: {},
  method: "TEST",
  originalUrl: "/api/trip-departures",
};

const createQuery = ({ resolve, populateCalls = [] }) => {
  const state = { skip: 0, limit: Infinity };
  const query = {
    populate(path, select) {
      populateCalls.push({ path, select });
      return query;
    },
    sort() {
      return query;
    },
    skip(value) {
      state.skip = value;
      return query;
    },
    limit(value) {
      state.limit = value;
      return query;
    },
    then(onFulfilled, onRejected) {
      return Promise.resolve(resolve(state)).then(onFulfilled, onRejected);
    },
  };
  return query;
};

const makeDocument = (data) => {
  const document = {
    ...data,
    async save() {
      this.updatedAt = new Date();
      return this;
    },
    toObject() {
      return Object.fromEntries(
        Object.entries(this).filter(([, value]) => typeof value !== "function"),
      );
    },
  };
  return document;
};

const matches = (row, filter) => {
  if (filter._id && String(row._id) !== String(filter._id)) return false;
  if (filter.tripId && String(row.tripId) !== String(filter.tripId)) return false;
  if (filter.status && row.status !== filter.status) return false;
  if (filter.source && row.source !== filter.source) return false;
  if (filter.isActive !== undefined && row.isActive !== filter.isActive) return false;
  if (filter.isDeleted === false && row.isDeleted !== false) return false;
  return true;
};

const installStore = ({ trip = { _id: tripId }, departures = [] } = {}) => {
  const rows = departures;
  const audits = [];
  const populateCalls = [];
  const originals = {
    tripFindOne: Trip.findOne,
    create: TripDeparture.create,
    findOne: TripDeparture.findOne,
    find: TripDeparture.find,
    findById: TripDeparture.findById,
    countDocuments: TripDeparture.countDocuments,
    auditCreate: AuditLog.create,
  };

  Trip.findOne = async (filter) => {
    if (!trip || String(filter._id) !== String(trip._id)) return null;
    if (filter.isDeleted?.$ne === true && trip.isDeleted === true) return null;
    return trip;
  };
  TripDeparture.create = async (payload) => {
    const now = new Date();
    const document = makeDocument({
      _id: departureId,
      status: "SCHEDULED",
      source: "MANUAL",
      isActive: true,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedBy: null,
      createdAt: now,
      updatedAt: now,
      ...payload,
    });
    rows.push(document);
    return document;
  };
  TripDeparture.findOne = (filter) =>
    createQuery({
      populateCalls,
      resolve: () => rows.find((row) => matches(row, filter)) || null,
    });
  TripDeparture.find = (filter) =>
    createQuery({
      populateCalls,
      resolve: ({ skip, limit }) =>
        rows.filter((row) => matches(row, filter)).slice(skip, skip + limit),
    });
  TripDeparture.findById = async (id) =>
    rows.find((row) => String(row._id) === String(id)) || null;
  TripDeparture.countDocuments = async (filter) =>
    rows.filter((row) => matches(row, filter)).length;
  AuditLog.create = async (entry) => {
    audits.push(entry);
    return entry;
  };

  return {
    rows,
    audits,
    populateCalls,
    restore() {
      Trip.findOne = originals.tripFindOne;
      TripDeparture.create = originals.create;
      TripDeparture.findOne = originals.findOne;
      TripDeparture.find = originals.find;
      TripDeparture.findById = originals.findById;
      TripDeparture.countDocuments = originals.countDocuments;
      AuditLog.create = originals.auditCreate;
    },
  };
};

test("TripDeparture completes create, read, list, update, toggle, delete and restore", async () => {
  const store = installStore();
  try {
    const created = await createTripDepartureService({
      data: {
        tripId,
        departureAt: "2026-10-10T08:00:00.000Z",
        arrivalAt: "2026-10-10T12:00:00.000Z",
        status: "DRAFT",
        pricing: { basePrice: 350, discountPrice: 0, currency: "SAR" },
        capacity: { totalSeats: 40 },
      },
      userId,
      req: request,
    });

    assert.equal(created.createdBy, userId);
    assert.equal(created.isDeleted, false);
    assert.equal(store.audits.at(-1).action, AUDIT_ACTIONS.CREATE);
    assert.equal(store.audits.at(-1).entity, AUDIT_ENTITIES.TRIP_DEPARTURE);

    const fetched = await getTripDepartureByIdService(departureId);
    assert.equal(fetched._id, departureId);
    assert.deepEqual(store.populateCalls[0], {
      path: "tripId",
      select: "nameAr nameEn type scope subtype source isActive",
    });

    const listed = await getAllTripDeparturesService({
      query: { tripId, page: 1, limit: 10 },
    });
    assert.equal(listed.departures.length, 1);
    assert.deepEqual(
      { total: listed.total, page: listed.page, limit: listed.limit, totalPages: listed.totalPages },
      { total: 1, page: 1, limit: 10, totalPages: 1 },
    );

    const updated = await updateTripDepartureService({
      departureId,
      data: { arrivalAt: "2026-10-10T13:00:00.000Z" },
      userId,
      req: request,
    });
    assert.equal(updated.updatedBy, userId);
    assert.equal(store.audits.at(-1).action, AUDIT_ACTIONS.UPDATE);
    assert.equal(store.audits.at(-1).before, null);
    assert.equal(store.audits.at(-1).after, null);

    await assert.rejects(
      updateTripDepartureService({
        departureId,
        data: { arrivalAt: "2026-10-10T07:00:00.000Z" },
        userId,
        req: request,
      }),
      ({ code, field }) =>
        code === "TRIP_ARRIVAL_BEFORE_DEPARTURE" && field === "arrivalAt",
    );

    const toggled = await toggleTripDepartureActiveService({
      departureId,
      userId,
      req: request,
    });
    assert.equal(toggled.isActive, false);
    assert.equal(toggled.status, "DRAFT");
    assert.equal(store.audits.at(-1).action, AUDIT_ACTIONS.STATUS_CHANGE);

    const deleted = await deleteTripDepartureService({
      departureId,
      userId,
      req: request,
    });
    assert.equal(deleted.isDeleted, true);
    assert.ok(deleted.deletedAt instanceof Date);
    assert.equal(deleted.deletedBy, userId);
    assert.equal(store.audits.at(-1).action, AUDIT_ACTIONS.DELETE);

    const afterDelete = await getAllTripDeparturesService({ query: {} });
    assert.equal(afterDelete.departures.length, 0);

    const restored = await restoreTripDepartureService({
      departureId,
      userId,
      req: request,
    });
    assert.equal(restored.isDeleted, false);
    assert.equal(restored.deletedAt, null);
    assert.equal(restored.deletedBy, null);
    assert.equal(restored.isActive, false);
    assert.equal(restored.updatedBy, userId);
    assert.equal(store.audits.at(-1).action, AUDIT_ACTIONS.RESTORE);
  } finally {
    store.restore();
  }
});

test("TripDeparture accepts a legacy Trip without isDeleted and rejects a deleted Trip", async () => {
  const legacyStore = installStore({ trip: { _id: tripId } });
  try {
    await createTripDepartureService({
      data: { tripId, departureAt: "2026-10-10T08:00:00.000Z" },
      userId,
      req: request,
    });
    assert.equal(legacyStore.rows.length, 1);
  } finally {
    legacyStore.restore();
  }

  const deletedStore = installStore({ trip: { _id: tripId, isDeleted: true } });
  try {
    await assert.rejects(
      createTripDepartureService({
        data: { tripId, departureAt: "2026-10-10T08:00:00.000Z" },
        userId,
        req: request,
      }),
      ({ code, statusCode }) => code === "TRIP_NOT_FOUND" && statusCode === 404,
    );
    assert.equal(deletedStore.rows.length, 0);
  } finally {
    deletedStore.restore();
  }
});

test("TripDeparture derives segment endpoints from the parent Trip route", async () => {
  const store = installStore({
    trip: {
      _id: tripId,
      type: "LAND",
      routeStops: [
        { location: "تعز" },
        { location: "عدن" },
        { location: "مكة" },
      ],
    },
  });

  try {
    const departure = await createTripDepartureService({
      data: {
        tripId,
        departureAt: "2026-10-10T08:00:00.000Z",
        segments: [{
          from: "مسار غير صحيح",
          to: "مسار آخر",
          serviceNumber: "BUS-1",
        }],
      },
      userId,
      req: request,
    });

    assert.deepEqual(
      departure.segments.map(({ from, to, serviceNumber }) => ({
        from,
        to,
        serviceNumber,
      })),
      [
        { from: "تعز", to: "عدن", serviceNumber: "BUS-1" },
        { from: "عدن", to: "مكة", serviceNumber: undefined },
      ],
    );
  } finally {
    store.restore();
  }
});
