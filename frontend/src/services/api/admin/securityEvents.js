import api from "../api";

export const apiGetSecurityEvents = (params) =>
  api.get("/security-events", { params });
