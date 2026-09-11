import api from "../api";
import {
  apiCreatePublicFlightDraft,
  apiSearchPublicFlights,
} from "./flightApi";

jest.mock("../api", () => ({
  post: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

test("public flight search never sends a provider selector", async () => {
  api.post.mockResolvedValue({ data: { success: true, data: [] } });
  const criteria = { origin: "JED", destination: "ADE", adults: 1 };

  await apiSearchPublicFlights(criteria);

  expect(api.post).toHaveBeenCalledWith("/public/flights/search", criteria);
  expect(api.post.mock.calls[0][1]).not.toHaveProperty("provider");
});

test("flight selection sends only the offer reference and comparison contract", async () => {
  api.post.mockResolvedValue({ data: { success: true, data: { _id: "draft-1" } } });
  const input = {
    offerId: "off_1",
    expected: {
      route: { origin: "JED", destination: "ADE" },
      pricing: { total: 850, currency: "SAR" },
      passengers: { adults: 1, children: 0, infants: 0, total: 1 },
    },
  };

  await apiCreatePublicFlightDraft(input);

  expect(api.post).toHaveBeenCalledWith("/public/flights/drafts", input);
});
