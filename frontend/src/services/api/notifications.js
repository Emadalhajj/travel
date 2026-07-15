import api from "./api";

export const apiGetNotifications = (params) =>
  api.get("/notifications", { params });

export const apiMarkNotificationAsRead = (id) =>
  api.patch(`/notifications/${id}/read`);

export const apiMarkAllNotificationsAsRead = () =>
  api.patch("/notifications/read-all");