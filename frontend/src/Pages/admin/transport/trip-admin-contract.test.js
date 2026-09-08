import { readFileSync } from "node:fs";
import path from "node:path";
import { tripFormConfig } from "../../../Components/common/ModalForms/transport/tripFormConfig";
import { tripDepartureFormConfig } from "../../../Components/common/ModalForms/transport/tripDepartureFormConfig";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import {
  formatTripRoute,
  buildTripSegments,
  getTripSubtypeOptions,
  TRIP_TYPE_OPTIONS,
} from "../../../constants/trips/trip.constants";

describe("unified admin trips contract", () => {
  it("exposes only AIR, LAND and SEA without legacy package/tripType", () => {
    const config = tripFormConfig([]);
    expect(TRIP_TYPE_OPTIONS.map(({ value }) => value)).toEqual(["AIR", "LAND", "SEA"]);
    expect(config.conditionKey).toBe("type");
    expect(config.commonFields.some(({ name }) => name === "tripType")).toBe(false);
    expect(JSON.stringify(config)).not.toContain('"package"');
  });

  it("resolves subtype options from the selected trip type", () => {
    expect(getTripSubtypeOptions("AIR").map(({ value }) => value)).toEqual(["FLIGHT"]);
    expect(getTripSubtypeOptions("LAND").map(({ value }) => value)).toContain("TRANSPORT");
    expect(getTripSubtypeOptions("SEA").map(({ value }) => value)).toContain("CRUISE");
  });

  it("formats missing legacy or unpopulated trips without crashing", () => {
    expect(formatTripRoute(null)).toBe("-");
    expect(formatTripRoute(undefined)).toBe("-");
    expect(formatTripRoute({ type: "AIR" })).toBe("-");
  });

  it("uses shared array fields for land stops and sea ports", () => {
    const config = tripFormConfig([]);
    expect(config.conditionalFields.LAND.find(({ name }) => name === "transportId").required).toBe(true);
    expect(config.conditionalFields.LAND.find(({ name }) => name === "routeStops").type).toBe("array");
    expect(config.conditionalFields.SEA.find(({ name }) => name === "ports").type).toBe("array");
  });

  it("builds immutable departure segment routes from the parent trip", () => {
    expect(buildTripSegments({
      type: "LAND",
      transportId: { _id: "transport-1" },
      routeStops: [{ location: "تعز" }, { location: "عدن" }, { location: "مكة" }],
    })).toMatchObject([
      { from: "تعز", to: "عدن", transportId: "transport-1" },
      { from: "عدن", to: "مكة", transportId: "transport-1" },
    ]);

    const segmentsField = tripDepartureFormConfig([]).commonFields.find(({ name }) => name === "segments");
    expect(segmentsField.structureLocked).toBe(true);
    expect(segmentsField.fields.filter(({ name }) => ["from", "to"].includes(name)).every(({ readOnly }) => readOnly)).toBe(true);
  });

  it("preserves existing land route stops while normalizing edit data", () => {
    const config = tripFormConfig([]);
    const trip = {
      type: "LAND",
      routeStops: [
        { location: "تعز", notes: "" },
        { location: "عدن", notes: "توقف" },
      ],
    };

    // This contract protects the data shape consumed by UniversalForm during edit.
    expect(normalizeForForm(trip, config).routeStops).toEqual(trip.routeStops);
  });

  it("keeps lifecycle status out of the departure form", () => {
    const names = tripDepartureFormConfig([]).commonFields.map(({ name }) => name);
    expect(names).not.toContain("status");
    expect(names).not.toContain("tripId");
    expect(names).toContain("capacity.totalSeats");
    expect(names).toContain("segments");
  });

  it("separates external flight search from the trip create payload", () => {
    const config = tripFormConfig([]);
    const originAirport = config.conditionalFields.AIR.find(({ name }) => name === "originAirport");
    const nameAr = config.commonFields.find(({ name }) => name === "nameAr");
    const source = config.conditionalFields.AIR.find(({ name }) => name === "source");

    expect(source.defaultValue).toBe("MANUAL");
    expect(originAirport.visibleWhen({ source: "MANUAL" })).toBe(true);
    expect(originAirport.visibleWhen({ source: "API" })).toBe(false);
    expect(nameAr.visibleWhen({ type: "AIR", source: "API" })).toBe(false);
    expect(config.commonFields.map(({ name }) => name)).not.toEqual(
      expect.arrayContaining(["adults", "children", "infants", "returnDate"]),
    );
  });

  it("uses dedicated lifecycle endpoints and unwraps mutations", () => {
    const api = readFileSync(path.resolve(__dirname, "../../../services/api/admin/tripDepartures.js"), "utf8");
    const page = readFileSync(path.resolve(__dirname, "./AdminTripDeparturesPage.jsx"), "utf8");
    expect(api).toContain("/${id}/schedule");
    expect(api).toContain("/${id}/cancel");
    expect(api).toContain("/${id}/complete");
    expect(page).toContain(".unwrap()");
    expect(page).toContain("getTripById(tripId)");
    expect(page).toContain("extraPayload: () => ({ tripId })");
    expect(page).toContain("formatTripRoute(parentTrip)");
    expect(page).toContain("parentTrip?.pricing?.basePrice");
    expect(page).not.toContain("window.confirm");
  });
});
