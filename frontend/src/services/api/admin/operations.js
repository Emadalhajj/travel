import api from "../api";

export const apiGetBookingOperations = (params = {}) =>
  api.get("/operations/bookings", { params });

export const apiGetBookingOperationsDetails = (bookingId) =>
  api.get(`/operations/bookings/${encodeURIComponent(bookingId)}`);
