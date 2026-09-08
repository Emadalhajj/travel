import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import ExtraService from "../../models/extra-services/extra-service-model.js";
import RoomType from "../../models/hotels/roomtype-model.js";
import Inventory from "../../models/inventory-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import Transport from "../../models/transportition/transport-model.js";
import VehicleRental from "../../models/transportition/vehicle-rental-model.js";
import Visa from "../../models/visa-model.js";
import { getAvailablePackageProductsService } from "../../services/availability/package-availability-service.js";

const queryWith = (records, onPopulate = () => {}, onSelect = () => {}) => ({
  populate(options, select) {
    onPopulate(options, select);
    return this;
  },
  select(fields) {
    onSelect(fields);
    return this;
  },
  lean: async () => records,
});

test("package availability sells TripDeparture inventory and splits AIR from LAND/SEA", async () => {
  const models = [RoomType, Visa, TripDeparture, Transport, ExtraService, VehicleRental, Inventory];
  const originalFind = new Map(models.map((model) => [model, model.find]));
  const startDate = new Date("2026-10-01T00:00:00.000Z");
  const endDate = new Date("2026-11-01T00:00:00.000Z");
  let departureFilter;
  let tripPopulate;
  let inventoryFilter;
  let inventorySelect;

  const departures = [
    {
      _id: "departure-air",
      tripId: {
        _id: "trip-air",
        nameAr: "رحلة جوية",
        nameEn: "Air trip",
        type: "AIR",
        source: "MANUAL",
        images: ["air.jpg"],
      },
      departureAt: new Date("2026-10-10T08:00:00.000Z"),
      arrivalAt: new Date("2026-10-10T12:00:00.000Z"),
      status: "SCHEDULED",
      source: "MANUAL",
      pricing: { basePrice: 500, discountPrice: 450, currency: "SAR" },
      isActive: true,
    },
    {
      _id: "departure-land",
      tripId: {
        _id: "trip-land",
        nameAr: "رحلة برية",
        nameEn: "Land trip",
        type: "LAND",
        source: "MANUAL",
      },
      departureAt: new Date("2026-10-12T08:00:00.000Z"),
      status: "SCHEDULED",
      pricing: { basePrice: 200, discountPrice: 0, currency: "SAR" },
      isActive: true,
    },
    {
      _id: "departure-sea-full",
      tripId: { _id: "trip-sea", type: "SEA" },
      departureAt: new Date("2026-10-14T08:00:00.000Z"),
      status: "SCHEDULED",
      pricing: { basePrice: 300, currency: "SAR" },
      isActive: true,
    },
    {
      _id: "departure-orphan",
      tripId: null,
      departureAt: new Date("2026-10-15T08:00:00.000Z"),
      status: "SCHEDULED",
      isActive: true,
    },
  ];

  try {
    RoomType.find = () => queryWith([]);
    Visa.find = () => queryWith([]);
    Transport.find = () => queryWith([]);
    ExtraService.find = () => queryWith([]);
    VehicleRental.find = () => queryWith([]);
    TripDeparture.find = (filter) => {
      departureFilter = filter;
      return queryWith(departures, (options) => {
        tripPopulate = options;
      });
    };
    Inventory.find = (filter) => {
      inventoryFilter = filter;
      return queryWith(
        [
          { itemId: "departure-air", available: 4 },
          {
            itemId: "departure-land",
            total: 5,
            reserved: 2,
            blocked: 1,
          },
          { itemId: "departure-sea-full", available: 3 },
        ],
        undefined,
        (fields) => {
          inventorySelect = fields;
        },
      );
    };

    const result = await getAvailablePackageProductsService({
      startDate,
      endDate,
      pilgrimsCount: 2,
    });

    assert.deepEqual(departureFilter, {
      departureAt: {
        $gte: startDate,
        $lt: endDate,
        $gt: departureFilter.departureAt.$gt,
      },
      status: "SCHEDULED",
      isActive: true,
      isDeleted: { $ne: true },
    });
    assert.ok(departureFilter.departureAt.$gt instanceof Date);
    assert.equal(tripPopulate.path, "tripId");
    assert.deepEqual(tripPopulate.match, {
      isActive: true,
      isDeleted: { $ne: true },
    });
    assert.equal(tripPopulate.select.includes("capacity"), false);
    assert.deepEqual(inventoryFilter, {
      inventoryType: "tripDeparture",
      itemId: {
        $in: ["departure-air", "departure-land", "departure-sea-full"],
      },
      isActive: true,
      isDeleted: { $ne: true },
    });
    assert.equal("date" in inventoryFilter, false);
    assert.equal(inventorySelect, "itemId total reserved blocked available");

    assert.deepEqual(result.flights.map(({ _id }) => _id), ["departure-air"]);
    assert.deepEqual(result.trips.map(({ _id }) => _id), [
      "departure-land",
      "departure-sea-full",
    ]);
    assert.equal(result.flights[0].tripId, "trip-air");
    assert.equal(result.flights[0].departureId, "departure-air");
    assert.equal(result.flights[0].price, 450);
    assert.equal(result.flights[0].availableCount, 4);
    assert.deepEqual(result.flights[0].inventory, {
      total: 0,
      reserved: 0,
      blocked: 0,
      available: 4,
    });
    assert.deepEqual(result.flights[0].pricing, {
      basePrice: 500,
      discountPrice: 450,
      finalPrice: 450,
      currency: "SAR",
    });
    assert.equal(result.flights[0].type, "flight");
    assert.equal(result.trips[0].price, 200);
    assert.equal(result.trips[0].availableCount, 2);
    assert.equal(result.trips[0].type, "trip");
    assert.equal(result.trips[1].tripType, "SEA");
  } finally {
    for (const [model, find] of originalFind) model.find = find;
  }
});

test("package trip availability no longer reads legacy Trip dates or capacity", () => {
  const servicePath = path.resolve(
    import.meta.dirname,
    "../../services/availability/package-availability-service.js",
  );
  const source = fs.readFileSync(servicePath, "utf8");

  assert.equal(source.includes('from "../../models/transportition/trip-model.js"'), false);
  assert.equal(source.includes("trip.startDate"), false);
  assert.equal(source.includes("trip.capacity.availableSeats"), false);
  assert.equal(source.includes('inventoryType: "trip"'), false);
});
