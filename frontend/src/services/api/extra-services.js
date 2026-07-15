import api from "./api";

export const apiGetExtraServices = (params) =>
  api.get("/extra-services", { params });

export const apiGetOneExtraService = (id) =>
  api.get(`/extra-services/${id}`);

export const apiCreateExtraService = (data) =>
  api.post("/extra-services", data);

export const apiUpdateExtraService = (id, data) =>
  api.put(`/extra-services/${id}`, data);

export const apiDeleteExtraService = (id) =>
  api.delete(`/extra-services/${id}`);

export const apiToggleExtraService = (id , status) =>
    api.patch(`/extra-services/toggle/${id}`, status)