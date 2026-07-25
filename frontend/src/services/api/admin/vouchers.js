import api from "../api";

export const apiGetVouchers = (params) => api.get("/vouchers", { params });

export const apiGetOneVoucher = (id) => api.get(`/vouchers/${id}`);

export const apiGenerateVoucher = (bookingId) =>
  api.post(`/vouchers/booking/${bookingId}`);

export const apiDownloadVoucher = (id) =>
  api.get(`/vouchers/${id}/download`, {
    responseType: "blob",
  });
