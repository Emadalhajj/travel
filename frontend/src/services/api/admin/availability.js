import api from "../api";

export const apiGetAvailablePackageProducts = (params, { signal } = {}) =>
  api.get("/availability/products", { params, signal });
