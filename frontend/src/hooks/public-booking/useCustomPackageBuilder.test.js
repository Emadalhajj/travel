import { act, renderHook } from "@testing-library/react";
import useCustomPackageBuilder from "./useCustomPackageBuilder";

const departure = (overrides = {}) => ({
  _id: "departure-air",
  departureId: "departure-air",
  tripId: "trip-air",
  type: "flight",
  tripType: "AIR",
  nameEn: "Flight",
  departureAt: "2030-10-02T08:00:00.000Z",
  arrivalAt: "2030-10-02T11:00:00.000Z",
  pricing: { finalPrice: 100, currency: "SAR" },
  inventory: { available: 4 },
  ...overrides,
});

test("selecting travel replaces the other travel bucket and keeps other products", () => {
  const { result } = renderHook(() => useCustomPackageBuilder());

  act(() => {
    result.current.addProduct("visas", { _id: "visa-1", priceAtTime: 20 });
    result.current.addProduct("flights", departure());
  });
  act(() => {
    result.current.addProduct("trips", departure({
      _id: "departure-land",
      departureId: "departure-land",
      tripId: "trip-land",
      type: "trip",
      tripType: "LAND",
    }));
  });

  expect(result.current.selectedProducts.flights).toEqual([]);
  expect(result.current.selectedProducts.trips).toHaveLength(1);
  expect(result.current.selectedProducts.visas).toHaveLength(1);
});

test("travel pricing is per traveler and draft carries authoritative departure identity", () => {
  const { result } = renderHook(() => useCustomPackageBuilder());

  act(() => {
    result.current.handleFormChange("travelersCount", 3);
    result.current.addProduct("flights", departure());
  });

  expect(result.current.pricing.subtotal).toBe(300);
  expect(result.current.hasValidTravelSelection()).toBe(true);
  expect(result.current.buildDraftUpdatePayload().trip).toMatchObject({
    tripId: "trip-air",
    departureId: "departure-air",
    departureAt: "2030-10-02T08:00:00.000Z",
    unitPrice: 100,
  });
  expect(result.current.selectedProducts.flights[0].raw).toBeUndefined();
});

test("date or traveler criteria changes clear only the travel selection", () => {
  const { result } = renderHook(() => useCustomPackageBuilder());

  act(() => {
    result.current.addProduct("visas", { _id: "visa-1" });
    result.current.addProduct("flights", departure());
  });
  act(() => result.current.handleFormChange("startDate", "2030-10-01"));

  expect(result.current.selectedProducts.flights).toEqual([]);
  expect(result.current.selectedProducts.trips).toEqual([]);
  expect(result.current.selectedProducts.visas).toHaveLength(1);
});

test("removal resolves a travel item by departureId", () => {
  const { result } = renderHook(() => useCustomPackageBuilder());
  act(() => result.current.addProduct("flights", departure()));
  act(() => result.current.removeProduct("flights", "departure-air"));
  expect(result.current.selectedProducts.flights).toEqual([]);
});

test("accommodation draft sends only selection identity and guest inputs", () => {
  const { result } = renderHook(() => useCustomPackageBuilder());

  act(() => {
    result.current.handleFormChange("startDate", "2030-10-01");
    result.current.handleFormChange("endDate", "2030-10-06");
    result.current.handleFormChange("roomsCount", 2);
    result.current.handleFormChange("adults", 2);
    result.current.handleFormChange("children", 1);
    result.current.addProduct("roomTypes", {
      _id: "room-1",
      productId: "room-1",
      nameAr: "اسم غير موثوق",
      hotel: { _id: "hotel-1", nameAr: "فندق غير موثوق" },
      mealPlan: "breakfast",
      pricing: { finalPrice: 999 },
    });
  });

  const payload = result.current.buildDraftUpdatePayload({
    packageType: "SERVICE",
    serviceType: "ACCOMMODATION",
  });

  expect(payload.hotel).toEqual({
    roomTypeId: "room-1",
    checkIn: "2030-10-01",
    checkOut: "2030-10-06",
    roomsCount: 2,
    adults: 2,
    children: 1,
  });
  expect(payload.data.selectedProducts).toEqual([
    { type: "ROOM_TYPE", productId: "room-1", quantity: 2 },
  ]);
  expect(payload.data.accommodationPricingPending).toBe(true);
});

test("accommodation selection is restored from the trusted draft snapshot", () => {
  const { result } = renderHook(() => useCustomPackageBuilder());

  act(() => result.current.hydrateAccommodationSelection({
    hotel: {
      roomTypeId: "room-1",
      roomTypeNameAr: "ديلوكس",
      roomTypeNameEn: "Deluxe",
      nameAr: "فندق موثوق",
      nameEn: "Trusted Hotel",
      checkIn: "2030-10-01T00:00:00.000Z",
      checkOut: "2030-10-06T00:00:00.000Z",
      roomsCount: 2,
      adults: 2,
      children: 2,
      mealPlan: "breakfast",
    },
  }));

  expect(result.current.formData).toMatchObject({
    startDate: "2030-10-01",
    endDate: "2030-10-06",
    roomsCount: 2,
    adults: 2,
    children: 2,
    travelersCount: 4,
  });
  expect(result.current.selectedProducts.roomTypes[0]).toMatchObject({
    productId: "room-1",
    nameEn: "Deluxe",
  });
});
