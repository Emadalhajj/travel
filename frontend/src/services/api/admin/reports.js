import api from "../api";

export const apiGetReportsOverview = (params = {}) => api.get("/reports/overview", { params });
export const apiGetBookingsReport = (params = {}) => api.get("/reports/bookings", { params });
export const apiGetPaymentsReport = (params = {}) => api.get("/reports/payments", { params });
export const apiGetProgramsReport = (params = {}) => api.get("/reports/programs", { params });
