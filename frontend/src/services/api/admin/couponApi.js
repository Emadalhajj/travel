import api from "../api";

const URL = "/admin/coupons";
export const apiGetCoupons = (params) => api.get(URL, { params });
export const apiCreateCoupon = (data) => api.post(URL, data);
export const apiUpdateCoupon = ({ id, data }) => api.patch(`${URL}/${id}`, data);
export const apiDeleteCoupon = (id) => api.delete(`${URL}/${id}`);

