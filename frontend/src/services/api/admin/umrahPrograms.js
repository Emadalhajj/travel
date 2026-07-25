import api from "../api";

// Admin
export const apiGetUmrahPrograms = (params) =>
  api.get("/umrah-programs", { params });

export const apiGetOneUmrahProgram = (id) => api.get(`/umrah-programs/${id}`);

export const apiCreateUmrahProgram = (data) =>
  api.post("/umrah-programs", data);

export const apiUpdateUmrahProgram = (id, data) =>
  api.patch(`/umrah-programs/${id}`, data);

export const apiDeleteUmrahProgram = (id) =>
  api.delete(`/umrah-programs/${id}`);

export const apiToggleUmrahProgram = (id, status) =>
  api.patch(`/umrah-programs/${id}/status`, { status });

// Public
export const apiGetPublicUmrahPrograms = (params) =>
  api.get("/umrah-programs/public", { params });

export const apiGetPublicUmrahProgramDetails = (id) =>
  api.get(`/umrah-programs/public/${id}`);
