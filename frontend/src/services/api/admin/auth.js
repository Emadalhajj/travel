// src/api/auth.js

import api from "../api";

export const registerUser = (userData) => api.post("/register", userData);
export const loginUser = (loginData) => api.post("/login", loginData);
export const updateUserProfile = (formData) => api.patch("/users/me", formData);

export const changePasswordUser = (payload) =>
  api.patch("/users/me/change-password", payload);
// Google OAuth
export const loginWithGoogle = () =>
  window.location.assign(`${api.defaults.baseURL}/auth/google`);

export const exchangeGoogleAuth = () =>
  api.post("/auth/google/exchange", {}, { withCredentials: true });
