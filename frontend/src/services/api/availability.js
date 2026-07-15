import api from "./api";

export const apiGetAvailablePackageProducts = (params) =>
  api.get("/availability/products", { params });

