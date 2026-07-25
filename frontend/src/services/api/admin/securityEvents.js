import api from "../api";

export const apiGetSecurityEvents = (params) =>
  api.get("/security-events", { params });

export const apiGetOneSecurityEvent = (id) => api.get(`/security-events/${id}`);
