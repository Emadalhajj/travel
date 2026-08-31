import api from "./api/api";

export const register = (userData) => api.post("/register", userData);
export const login = (loginData) => api.post("/login", loginData);
export const requestPasswordReset = (email) =>
  api.post("/forgot-password", { email });
export const resetPassword = (token, password, confirmPassword) =>
  api.post(`/reset-password/${encodeURIComponent(token)}`, {
    password,
    confirmPassword,
  });

export default api;
