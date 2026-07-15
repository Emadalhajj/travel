/**
    * 🟢 normalizeLocation
    * وظيفة: تطبيع بيانات الموقع الجغرافي (الدولة، المدينة، العنوان، الإحداثيات) لضمان تنسيق موحد وصحيح.
     * المدخلات: كائن يحتوي على خصائص الموقع (country, city, address, coordinates).
     * المخرجات: كائن جديد يحتوي على نفس الخصائص بعد تطبيعها.
 */
import { normalizeString } from "../generic/normalizeString.js";
import { normalizeCoordinates } from "./normalizeCoordinates.js";

export const normalizeLocation = (
  location = {},
) => {
  return {
    country: normalizeString(location.country),

    city: normalizeString(location.city),

    address: normalizeString(location.address),

    coordinates: normalizeCoordinates(
      location.coordinates,
    ),
  };
};