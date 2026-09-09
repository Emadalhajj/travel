import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import DuffelFlightSearchPanel from "./DuffelFlightSearchPanel";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: "ar" } }),
}));

jest.mock("../../../../services/api/admin/trips", () => ({
  searchExternalFlightsApi: jest.fn(),
  importExternalFlightApi: jest.fn(),
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

test("searches, previews and confirms through one atomic import request", async () => {
  const searchFlights = jest.fn().mockResolvedValue({ data: { data: [offer] } });
  const importOffer = jest.fn().mockResolvedValue({
    data: { data: { items: [{ departure: { _id: "dep_1" } }] } },
  });
  render(<DuffelFlightSearchPanel searchFlights={searchFlights} importOffer={importOffer} />);

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
  fireEvent.click(screen.getByRole("button", { name: "تأكيد الاستيراد" }));
  await waitFor(() => expect(importOffer).toHaveBeenCalledWith({
    provider: "DUFFEL",
    offerId: "off_1",
  }));
  expect(await screen.findByText("تم استيراد 1 مغادرة بنجاح")).toBeTruthy();
});

test("distinguishes initial and searched-empty states", async () => {
  const searchFlights = jest.fn().mockResolvedValue({ data: { data: [] } });
  render(<DuffelFlightSearchPanel searchFlights={searchFlights} />);
  expect(screen.getByText("ابدأ البحث لعرض الرحلات المتاحة")).toBeTruthy();

  const airports = screen.getAllByPlaceholderText("IATA");
  fireEvent.change(airports[0], { target: { value: "JED" } });
  fireEvent.change(airports[1], { target: { value: "ADE" } });
  fireEvent.change(screen.getAllByTestId("calendar-field")[0], { target: { value: "2099-09-10" } });
  fireEvent.click(screen.getByRole("button", { name: "بحث" }));

  expect(await screen.findByText("لا توجد رحلات مطابقة")).toBeTruthy();
});
