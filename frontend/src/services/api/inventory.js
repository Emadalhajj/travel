import api from "./api";

export const apiGetInventory = (params) =>
  api.get("/inventory", { params });

export const apiCreateInventory = (data) =>
  api.post("/inventory", data);

export const apiUpsertInventoryPeriod = (data) =>
  api.post("/inventory/period", data);

export const apiUpdateInventory = (id, data) =>
  api.patch(`/inventory/${id}`, data);

export const apiDeleteInventory = (id) =>
  api.delete(`/inventory/${id}`);
export const apiCreateRoomTypeInventory = (data) =>
  api.post("/inventory/room-types", data);

export const apiGetInventoryPeriods = (params) =>
  api.get("/inventory/periods", { params });

export const apiGetProgramInventory = ({
  programId,
  startDate,
  endDate,
}) =>
  api.get("/inventory", {
    params: {
      inventoryType: "umrahProgram",
      itemId: programId,
      startDate,
      endDate,
      limit: 1000,
    },
  });