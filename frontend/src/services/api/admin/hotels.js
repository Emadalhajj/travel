import api from "../api";

// hotels
export const apiGetAllHotels = (params) => api.get("/hotels", { params });
export const apiGetOneHotel = (id) => api.get(`/hotel/${id}`);
export const apiCreateHotel = (payload) => api.post("/hotel", payload);
export const apiUpdateHotel = (id, payload) => api.put(`/hotel/${id}`, payload);
export const apiDeleteHotel = (id) => api.delete(`/hotel/${id}`);
export const apiToggleHotel = (id) => api.patch(`/hotel/toggle/${id}`);

// roomtype mangemet

export const apiGetRoomType = (params) => api.get("/room-types", { params });

export const apiGetOneRoomType = (id) => api.get(`/room-types/${id}`);
export const apiCreateRoomType = (data) => api.post("/room-types", data);

export const apiUpdateRoomType = (id, data) =>
  api.put(`/room-types/${id}`, data);

export const apiDeleteRoomType = (id) => api.delete(`/room-types/${id}`);

// get roomtype by hotel id
export const apiGetRoomTypesByHotelId = (hotelId) =>
  api.get(`/hotel/${hotelId}/room-types`);
export const apiToggleRoomType = (id) => api.patch(`/room-type/toggle/${id}`);
