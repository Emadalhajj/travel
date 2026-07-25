import api from "../api";

export const apiGetAuditLogs = (params) => api.get("/audit-logs", { params });

export const apiGetOneAuditLog = (id) => api.get(`/audit-logs/${id}`);
