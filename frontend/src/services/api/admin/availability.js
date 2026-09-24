import api from "../api";

export const apiGetAvailablePackageProducts = (params, { signal } = {}) =>
  api.get("/availability/products", { params, signal });

export const apiSearchPublicAccommodations = (params, { signal } = {}) =>
  api.get("/public/accommodations/search", { params, signal });
