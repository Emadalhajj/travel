// src/api/transports.js
import api from "../api";

export const getTransports = (params) => api.get("/transport", { params });
export const getTransportById = (id) => api.get(`/transport/${id}`);

export const createTransport = (data) => api.post("/transport/", data);
export const updateTransport = (id, data) => api.put(`/transport/${id}`, data);
export const deleteTransport = (id) => api.delete(`/transport/${id}`);

export const toggleTransportStatus = (id) =>
  api.patch(`/transport/toggle/${id}`);
