// services/notifications/whatsapp-service.js

/*
=====================================================
WhatsApp Service
=====================================================

هذا الملف مسؤول عن إرسال رسائل واتساب.

لاحقاً يمكن ربطه مع:
-----------------------------------------------------
- WhatsApp Cloud API
- Twilio WhatsApp
- أي مزود واتساب رسمي
=====================================================
*/

export const sendWhatsApp = async ({
  to,
  message,
}) => {
  console.log("WHATSAPP SENT:", {
    to,
    message,
  });

  return {
    success: true,
    provider: "mock",
  };
};