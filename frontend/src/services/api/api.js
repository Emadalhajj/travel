// هذا الملف مسؤول عن الاتصال العام بالسيرفر وإضافة التوكن والتعامل مع الأخطاء.
// src/api/api.js
import axios from "axios";
import i18n from "../../i18n";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  // headers: { "Content-Type": "multipart/form-data" },
});

const normalizeLanguageHeader = (value) => {
  const language = String(value || "").toLowerCase();

  if (language.startsWith("ar") || language.includes("arab")) return "ar";
  if (language.startsWith("en") || language.includes("engl")) return "en";

  return "en";
};

// 🧠 إضافة التوكن في كل طلب تلقائيًا
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem("currentUser");
    const tokenFromUser = user ? JSON.parse(user)?.token : null;
    const token = tokenFromUser || localStorage.getItem("token");
    
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // ←←← اللغة (هذا هو الحل) ←←←
    const lang = normalizeLanguageHeader(
      i18n.language || localStorage.getItem("lang") || "en",
    );
    config.headers["Accept-Language"] = lang;
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 التعامل مع الأخطاء العامة
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const publicAuthPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/google/exchange"];
    const requestPath = String(error.config?.url || "");
    const isPublicAuthRequest = publicAuthPaths.some((path) => requestPath.includes(path));
    if (error.response?.status === 401 && !isPublicAuthRequest) {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
      window.location.href = "/authpage";
    }
    return Promise.reject(error);
  }
);

export default api;
