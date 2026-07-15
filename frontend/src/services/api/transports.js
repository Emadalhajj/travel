// src/api/transports.js
import api from "./api";

export const getTransports = (params) => api.get("/transport" , {params});
export const getTransportById = (id) => api.get(`/transport/${id}`)

export const createTransport = (data) => api.post("/transport/", data);
export const updateTransport = (id, data) => api.put(`/transport/${id}`, data);
export const deleteTransport = (id) => api.delete(`/transport/${id}`);

export const toggleTransportStatus = (id)=> api.patch(`/transport/toggle/${id}`);

//trips 

export const getAllTrips = (params) => api.get("/trip" , {params}) 

export const getTripById = (id) => api.get(`/trip/${id}`)

export const createTripApi = (data) => api.post("/trip" , data)

export const updateTripApi = (id , data) => api.patch(`/trip/${id}` , data)


export const deleteTripApi = (id) => api.delete(`/trip/${id}`)

export const  toggleTripStatus = (id) => api.patch(`/trip/toggle/${id}`)