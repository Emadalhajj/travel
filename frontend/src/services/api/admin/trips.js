import api from "../api";

export const getAllTrips = (params) => api.get("/trip", { params });
export const getTripById = (id) => api.get(`/trip/${id}`);
export const createTripApi = (data) => api.post("/trip", data);
export const updateTripApi = (id, data) => api.patch(`/trip/${id}`, data);
export const deleteTripApi = (id) => api.delete(`/trip/${id}`);
export const toggleTripStatus = (id) => api.patch(`/trip/toggle/${id}`);
export const searchExternalFlightsApi = (criteria) =>
  api.post("/admin/trips/providers/search", criteria);
export const importExternalFlightApi = ({ provider = "DUFFEL", offerId }) =>
  api.post("/admin/trips/providers/import", { provider, offerId });
