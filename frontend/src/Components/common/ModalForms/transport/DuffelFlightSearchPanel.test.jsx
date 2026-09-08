import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import DuffelFlightSearchPanel from "./DuffelFlightSearchPanel";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: "ar" } }),
}));

jest.mock("../../../../services/api/admin/trips", () => ({
  searchExternalFlightsApi: jest.fn(),
}));

jest.mock("../../../common/CalendarField", () => function CalendarField({ value, onChange }) {
  return <input data-testid="calendar-field" value={value} onChange={(event) => onChange(event.target.value)} />;
});

const offer = {
  offerId: "off_1",
  expiresAt: "2099-09-10T10:00:00Z",
  airline: { name: "Test Air" },
  cabinClass: "ECONOMY",
  pricing: { total: 1200, currency: "SAR" },
  origin: { code: "JED" },
  destination: { code: "ADE" },
  slices: [{
    id: "slice_1",
    origin: { code: "JED" },
    destination: { code: "ADE" },
    segmentIds: ["seg_1"],
  }],
  segments: [{
    id: "seg_1",
    origin: { code: "JED" },
    destination: { code: "ADE" },
    departureAt: "2099-09-10T08:00:00Z",
    arrivalAt: "2099-09-10T10:00:00Z",
    marketingCarrier: { name: "Test Air" },
  }],
};

test("searches, previews and confirms without creating a Trip", async () => {
  const searchFlights = jest.fn().mockResolvedValue({ data: { data: [offer] } });
  render(<DuffelFlightSearchPanel searchFlights={searchFlights} />);

  const airports = screen.getAllByPlaceholderText("IATA");
  fireEvent.change(airports[0], { target: { value: "jed" } });
  fireEvent.change(airports[1], { target: { value: "ade" } });
  fireEvent.change(screen.getAllByTestId("calendar-field")[0], { target: { value: "2099-09-10" } });
  fireEvent.click(screen.getByRole("button", { name: "بحث" }));

  await waitFor(() => expect(searchFlights).toHaveBeenCalledTimes(1));
  expect(searchFlights).toHaveBeenCalledWith(expect.objectContaining({
    provider: "DUFFEL",
    origin: "JED",
    destination: "ADE",
    adults: 1,
  }));
  expect(searchFlights.mock.calls[0][0]).not.toHaveProperty("nameAr");

  fireEvent.click(await screen.findByRole("button", { name: "اختيار" }));
  expect(screen.getByTestId("duffel-offer-preview")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "تأكيد الاختيار" }));
  expect(screen.getByText("العرض جاهز للاستيراد في المرحلة التالية")).toBeTruthy();
});
