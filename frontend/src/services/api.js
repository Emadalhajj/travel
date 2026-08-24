// مكرر 

import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost:5000/api", // 🔹 الرابط الأساسي للسيرفر
    headers: {
    "Content-Type": "application/json",
  },
})
// 🧩 إضافة Interceptor قبل إرسال أي طلب

api.interceptors.request.use((config)=>{
    const user = localStorage.getItem("currentUser")
    const tokenFromUser = user ? JSON.parse(user)?.token : null;
    const token = tokenFromUser || localStorage.getItem("token");
    if(token){
      config.headers.Authorization = `Bearer ${token}`; // 🔹 إضافة التوكن إلى هيدر الطلب
    }
    return config;
} ,
(error) => Promise.reject(error) // 🔹 التعامل مع الأخطاء في إعداد الطلب
)

api.interceptors.response.use(
    (response) => response , 
    (error) => {
      const publicAuthPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/google/exchange"];
      const requestPath = String(error.config?.url || "");
      const isPublicAuthRequest = publicAuthPaths.some((path) => requestPath.includes(path));
      if (error.response?.status === 401 && !isPublicAuthRequest) {
      console.warn("⚠️ Unauthorized, logging out...");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
      window.location.href = "/authpage";
         }
           return Promise.reject(error);
  }
)
export const register = (userData) => api.post("/register", userData);
export const loging = (loginData) => api.post("/login" , loginData)
export const requestPasswordReset = (email) => api.post("/forgot-password", { email });
export const resetPassword = (token, password, confirmPassword) =>
  api.post(`/reset-password/${encodeURIComponent(token)}`, {
    password,
    confirmPassword,
  });

// const  API_BASC_URL = 'http://localhost:5000/api';
// export const register = (userData) => axios.post(`${API_BASC_URL}/register`, userData);
// export const login = (loginData) => axios.post(`${API_BASC_URL}/login`, loginData);
export default api
