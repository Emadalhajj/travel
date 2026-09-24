import api from "../api";

export const apiGetBookingOperations = (params = {}) =>
  api.get("/operations/bookings", { params });

export const apiGetBookingOperationsDetails = (bookingId) =>
  api.get(`/operations/bookings/${encodeURIComponent(bookingId)}`);

export const apiUpdateBookingFulfillment = (bookingId, payload) =>
  api.patch(`/operations/bookings/${encodeURIComponent(bookingId)}/fulfillment`, payload);

export const apiUploadBookingServiceDocuments = (bookingId, payload) => {
  const body = new FormData();
  payload.documents.forEach((file) => body.append("documents", file));
  ["documentType", "titleAr", "titleEn", "note", "sendEmail", "sendWhatsapp"].forEach((key) => {
    body.append(key, payload[key] ?? "");
  });
  return api.post(`/operations/bookings/${encodeURIComponent(bookingId)}/service-documents`, body);
};

export const apiDeliverBookingServiceDocuments = (bookingId, payload) =>
  api.post(`/operations/bookings/${encodeURIComponent(bookingId)}/service-documents/deliver`, payload);
