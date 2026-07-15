import axios from "axios";
const api = axios.create({ baseURL: "http://localhost:5000/api", withCredentials: true });
api.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const token = user?.token || localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
