/**
 *يتعامل مع:

الإحداثيات.
يستخدم مع:

الفندق
النقل
أماكن التجمع
مثلاً:

خرائط Google Maps
Location Picker

لكن القيم غالبًا تأتي string. 
يتم تحويلها الى تحولها إلى أرقام باستخدام Number() أو parseFloat()، مع التعامل مع الحالات التي قد تكون فيها القيم غير صالحة (مثل null أو "") وتحويلها إلى 0 أو قيمة افتراضية أخرى.
 * 
 */
export const normalizeCoordinates = (
  coordinates = {},
) => {
  return {
    lat: Number(coordinates.lat) || 0, // تحويل lat إلى رقم أو 0

    lng: Number(coordinates.lng) || 0, // تحويل lng إلى رقم أو 0
  };
};