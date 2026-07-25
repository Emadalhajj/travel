// 🧩 4️⃣ visas.js — التأشيرات
import api from "../api";

export const apiGetVisas = (params) => api.get("/visa", { params });
export const apiGetVisa = (id) => api.get(`/visa/${id}`);

export const apiCreateVisa = (data) => api.post("/visa", data);
export const apiUpdateVisa = (id, data) => api.put(`/visa/${id}`, data);
export const apiDeleteVisa = (id) => api.delete(`/visa/${id}`);
export const apiToggleVisa = (id) => api.patch(`/visa/${id}/toggle`);

// ادارة انواع التاشيرات

export const apiGetVisaTypes = () => api.get("/visa-types");

export const apiCreateVisaType = (data) => api.post("/visa-types", data);

export const apiUpdateVisaType = (id, data) =>
  api.put(`/visa-types/${id}`, data);

export const apiDeleteVisaType = (id) => api.delete(`/visa-types/${id}`);
