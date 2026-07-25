// src/api/flights.js
import api from "../api";

export const getFlights = () => api.get("/flights");
export const createFlight = (data) => api.post("/flights", data);
export const updateFlight = (id, data) => api.put(`/flights/${id}`, data);
export const deleteFlight = (id) => api.delete(`/flights/${id}`);
