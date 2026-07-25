import api from "../api";

export const apiGetBookings = (params) => api.get("/bookings", { params });

export const apiGetOneBooking = (id) => api.get(`/bookings/${id}`);

export const apiCreateBooking = (data) => api.post("/bookings", data);

export const apiUpdateBooking = (id, data) => api.put(`/bookings/${id}`, data);

export const apiDeleteBooking = (id) => api.delete(`/bookings/${id}`);

export const apiUpdateBookingStatus = (id, status) =>
  api.patch(`/bookings/${id}/status`, { status });

export const apiGetMyBookings = (params) =>
  api.get("/bookings/my-bookings", { params });
