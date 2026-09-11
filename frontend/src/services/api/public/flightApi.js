import api from "../api";

export const apiSearchPublicFlights = async (criteria) => {
  const response = await api.post("/public/flights/search", criteria);
  return response.data;
};

export const apiCreatePublicFlightDraft = async ({ offerId, expected }) => {
  const response = await api.post("/public/flights/drafts", { offerId, expected });
  return response.data;
};
