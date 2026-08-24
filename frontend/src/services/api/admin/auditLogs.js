import api from "../api";

export const apiGetAuditLogs = (params) => api.get("/audit-logs", { params });

export const apiGetOneAuditLog = (entity, entityId) =>
  api.get(`/audit-logs/${encodeURIComponent(entity)}/${encodeURIComponent(entityId)}`);
