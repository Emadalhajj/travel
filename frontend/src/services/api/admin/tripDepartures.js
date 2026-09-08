import api from "../api";

const base = "/trip-departures";
export const getTripDepartures = (params) => api.get(base, { params });
export const getTripDeparture = (id) => api.get(`${base}/${id}`);
export const createTripDepartureApi = (data) => api.post(base, data);
export const updateTripDepartureApi = (id, data) => api.patch(`${base}/${id}`, data);
export const scheduleTripDepartureApi = (id) => api.post(`${base}/${id}/schedule`);
export const cancelTripDepartureApi = (id) => api.post(`${base}/${id}/cancel`);
export const completeTripDepartureApi = (id) => api.post(`${base}/${id}/complete`);
export const toggleTripDepartureApi = (id) => api.patch(`${base}/${id}/toggle-active`);
export const deleteTripDepartureApi = (id) => api.delete(`${base}/${id}`);
