import { fireEvent, render, screen } from "@testing-library/react";
import ProductCard from "./ProductCard";

const category = { key: "flights", labelAr: "الرحلات الجوية", labelEn: "Flights" };
const product = {
  _id: "departure-1",
  departureId: "departure-1",
  tripId: "trip-1",
  tripType: "AIR",
  nameAr: "رحلة جوية",
  originAirport: "RUH",
  destinationAirport: "JED",
  departureAt: "2030-10-02T08:00:00.000Z",
  pricing: { finalPrice: 450, currency: "SAR" },
  inventory: { available: 2 },
};

test("travel card disables selection when inventory is below traveler count", () => {
  const onAddItem = jest.fn();
  render(
    <ProductCard
      product={product}
      category={category}
      travelersCount={3}
      onAddItem={onAddItem}
      lang="ar"
      mode="custom"
    />,
  );

  const button = screen.getByRole("button", { name: /المتاح 2 فقط/ });
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(onAddItem).not.toHaveBeenCalled();
  expect(screen.getByText("RUH → JED")).toBeTruthy();
});
