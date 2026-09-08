import {
  compactTravelProduct,
  formatTravelRoute,
  getProductSelectionId,
} from "./productSelection";

test("TripDeparture identity takes priority over legacy product identifiers", () => {
  expect(getProductSelectionId({
    departureId: "departure-1",
    productId: "legacy-product",
    _id: "legacy-id",
  })).toBe("departure-1");
});

test("travel selection is compact and does not retain raw provider payload", () => {
  const item = compactTravelProduct({
    category: "flights",
    raw: {
      _id: "departure-1",
      departureId: "departure-1",
      tripId: "trip-1",
      tripType: "AIR",
      originAirport: "RUH",
      destinationAirport: "JED",
      pricing: { finalPrice: 450, currency: "SAR" },
      providerPayload: { secret: "not-for-draft" },
    },
  });

  expect(item).toMatchObject({
    departureId: "departure-1",
    tripId: "trip-1",
    priceAtTime: 450,
  });
  expect(item.raw).toBeUndefined();
  expect(item.providerPayload).toBeUndefined();
  expect(formatTravelRoute(item)).toBe("RUH → JED");
});
