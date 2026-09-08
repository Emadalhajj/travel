import assert from "node:assert/strict";
import test from "node:test";

import Booking from "../../models/booking/booking-model.js";
import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import Trip from "../../models/transportition/trip-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import Inventory from "../../models/inventory-model.js";
import {
  buildBookingItemsFromDraft,
  buildBookingProductReferences,
  createDraftBooking,
  updateDraftBooking,
} from "../../services/draft-bookings/draft-booking-service.js";
import { DRAFT_BOOKING_STATUS } from "../../constants/draft-bookings/draft-booking-status.js";

const ids = {
  user: "64b000000000000000000001",
  trip: "64b000000000000000000002",
  otherTrip: "64b000000000000000000003",
  departure: "64b000000000000000000004",
};

const departureRow = {
  _id: ids.departure,
  tripId: ids.trip,
  departureAt: new Date("2026-10-02T08:00:00.000Z"),
  arrivalAt: new Date("2026-10-02T11:00:00.000Z"),
  source: "MANUAL",
  pricing: { basePrice: 500, discountPrice: 450, currency: "SAR" },
};

const tripRow = {
  _id: ids.trip,
  nameAr: "رحلة مكة",
  nameEn: "Makkah Trip",
  type: "AIR",
  scope: "INTERNATIONAL",
  subtype: "ONE_WAY",
  source: "MANUAL",
  fromCity: "Riyadh",
  toCity: "Jeddah",
};

const queryReturning = (value) => ({
  select() {
    return this;
  },
  async lean() {
    return structuredClone(value);
  },
});

const withTripModels = async (callback) => {
  const originals = {
    departureFindOne: TripDeparture.findOne,
    tripFindOne: Trip.findOne,
    inventoryFindOne: Inventory.findOne,
    draftCreate: DraftBooking.create,
    draftFindOne: DraftBooking.findOne,
  };

  TripDeparture.findOne = () => queryReturning(departureRow);
  Trip.findOne = () => queryReturning(tripRow);
  Inventory.findOne = () => queryReturning({ _id: "inventory-1" });

  try {
    await callback();
  } finally {
    TripDeparture.findOne = originals.departureFindOne;
    Trip.findOne = originals.tripFindOne;
    Inventory.findOne = originals.inventoryFindOne;
    DraftBooking.create = originals.draftCreate;
    DraftBooking.findOne = originals.draftFindOne;
  }
};

test("new Draft saves an authoritative TripDeparture snapshot", async () => {
  await withTripModels(async () => {
    let createdInput;
    DraftBooking.create = async (input) => {
      createdInput = structuredClone(input);
      return createdInput;
    };

    await createDraftBooking({
      userId: ids.user,
      data: {
        trip: {
          tripId: ids.trip,
          departureId: ids.departure,
          unitPrice: 1,
          departureAt: "2030-01-01T00:00:00.000Z",
          quantity: 2,
        },
      },
    });

    assert.equal(createdInput.trip.tripId, ids.trip);
    assert.equal(createdInput.trip.departureId, ids.departure);
    assert.equal(
      new Date(createdInput.trip.departureAt).toISOString(),
      departureRow.departureAt.toISOString(),
    );
    assert.equal(createdInput.trip.unitPrice, 450);
    assert.equal(createdInput.trip.nameEn, tripRow.nameEn);
    assert.equal("availableSeats" in createdInput.trip, false);
  });
});

test("Draft update preserves the verified departure identity", async () => {
  await withTripModels(async () => {
    const draft = {
      _id: "draft-1",
      user: ids.user,
      status: DRAFT_BOOKING_STATUS.DRAFT,
      travelers: [],
      hosts: [],
      data: {},
      trip: null,
      async save() {
        return this;
      },
    };
    DraftBooking.findOne = async () => draft;

    const updated = await updateDraftBooking({
      draftId: draft._id,
      userId: ids.user,
      data: {
        trip: {
          tripId: ids.trip,
          departureId: ids.departure,
          quantity: 3,
        },
      },
    });

    assert.equal(String(updated.trip.tripId), ids.trip);
    assert.equal(String(updated.trip.departureId), ids.departure);
    assert.equal(updated.trip.quantity, 3);
  });
});

test("Draft rejects a departure belonging to another Trip", async () => {
  await withTripModels(async () => {
    let createCalled = false;
    DraftBooking.create = async () => {
      createCalled = true;
    };

    await assert.rejects(
      () => createDraftBooking({
        userId: ids.user,
        data: {
          trip: {
            tripId: ids.otherTrip,
            departureId: ids.departure,
          },
        },
      }),
      ({ code, field }) =>
        code === "TRIP_DEPARTURE_TRIP_MISMATCH" && field === "trip.tripId",
    );
    assert.equal(createCalled, false);
  });
});

test("Draft rejects a departure without active inventory", async () => {
  await withTripModels(async () => {
    Inventory.findOne = () => queryReturning(null);

    await assert.rejects(
      () => createDraftBooking({
        userId: ids.user,
        data: {
          trip: { tripId: ids.trip, departureId: ids.departure },
        },
      }),
      ({ code, field }) =>
        code === "TRIP_DEPARTURE_NOT_AVAILABLE" &&
        field === "trip.departureId",
    );
  });
});

test("new Draft cannot write a legacy trip without departureId", async () => {
  await withTripModels(async () => {
    await assert.rejects(
      () => createDraftBooking({
        userId: ids.user,
        data: { trip: { tripId: ids.trip } },
      }),
      ({ code, field }) =>
        code === "TRIP_DEPARTURE_DATA_INCOMPLETE" &&
        field === "trip.departureId",
    );
  });
});

test("booking items prefer draft.trip and never treat a departure _id as tripId", () => {
  const official = buildBookingItemsFromDraft({
    trip: {
      tripId: ids.trip,
      departureId: ids.departure,
      nameEn: "Official snapshot",
      departureAt: departureRow.departureAt,
      arrivalAt: departureRow.arrivalAt,
      unitPrice: 450,
    },
    data: {
      selectedProducts: [{
        type: "flight",
        _id: ids.departure,
        tripId: ids.otherTrip,
        departureId: ids.departure,
        nameEn: "Untrusted selection",
        departureAt: "2030-01-01T00:00:00.000Z",
      }],
    },
  }).trip;

  assert.equal(String(official.tripId), ids.trip);
  assert.equal(String(official.departureId), ids.departure);
  assert.equal(official.tripNameEn, "Official snapshot");
  assert.equal(official.departureAt, departureRow.departureAt);

  const selectedOnly = buildBookingItemsFromDraft({
    data: {
      selectedProducts: [{
        type: "flight",
        _id: ids.departure,
        tripId: ids.trip,
        departureId: ids.departure,
        departureAt: departureRow.departureAt,
      }],
    },
  }).trip;
  assert.equal(String(selectedOnly.tripId), ids.trip);
  assert.notEqual(String(selectedOnly.tripId), ids.departure);
});

test("Booking stores separate Trip and TripDeparture references plus an immutable snapshot", () => {
  const source = {
    tripId: ids.trip,
    departureId: ids.departure,
    tripNameEn: "Historical name",
    departureAt: departureRow.departureAt,
    arrivalAt: departureRow.arrivalAt,
    unitPrice: 450,
    price: 450,
  };
  const references = buildBookingProductReferences({ trip: source });
  const booking = new Booking({
    user: ids.user,
    ...references,
    bookingItems: { trip: source },
  });

  source.tripNameEn = "Changed later";
  source.unitPrice = 999;

  assert.equal(String(booking.trip), ids.trip);
  assert.equal(String(booking.tripDeparture), ids.departure);
  assert.equal(booking.bookingItems.trip.tripNameEn, "Historical name");
  assert.equal(booking.bookingItems.trip.unitPrice, 450);
});
