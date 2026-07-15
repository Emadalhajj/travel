// src/api/users.js
import api from "./api";

export const getAllUsers = (params) => api.get("/users", { params });
export const getUserById = (id) => api.get(`/users/${id}`)

export const createUser = (data) => api.post("/users" , data)

export const updatedUser = (id, data) => api.patch(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const toggleUserStatus = (id) => api.patch(`/users/${id}/toggle-status`)
export const changePasswordUser = (id, newPassword) =>
  api.patch(`/users/${id}/change-password`, { password: newPassword });