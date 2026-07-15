import api from "./api";

export const apiGetDraftBookings = (params) =>
  api.get("/draft-bookings", { params });

export const apiGetOneDraftBooking = (id) =>
  api.get(`/draft-bookings/${id}`);

export const apiCreateDraftBooking = (data) =>
  api.post("/draft-bookings", data);

export const apiUpdateDraftBooking = (id, data) =>
  api.put(`/draft-bookings/${id}`, data);

export const apiDeleteDraftBooking = (id) =>
  api.delete(`/draft-bookings/${id}`);

export const apiSubmitDraftBooking = (id) =>
  api.post(`/draft-bookings/${id}/submit`);