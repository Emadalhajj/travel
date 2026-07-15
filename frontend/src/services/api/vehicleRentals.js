import api from "./api";

export const apiGetVehicleRentals = (params) =>
  api.get("/vehicle-rentals", { params });

export const apiGetOneVehicleRental = (id) =>
  api.get(`/vehicle-rentals/${id}`);

export const apiCreateVehicleRental = (data) =>
  api.post("/vehicle-rentals", data);

export const apiUpdateVehicleRental = (id, data) =>
  api.put(`/vehicle-rentals/${id}`, data);

export const apiDeleteVehicleRental = (id) =>
  api.delete(`/vehicle-rentals/${id}`);
export const apiToggleVehicleRentalActive = (id) =>
  api.patch(`/vehicle-rentals/${id}/toggle-active`, {
    // No body needed for toggle, but you can include any necessary data here
  });