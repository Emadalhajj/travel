// services/notifications/sms-service.js

/*
=====================================================
SMS Service
=====================================================

هذا الملف مسؤول عن إرسال SMS.

لاحقاً يمكن ربطه مع:
-----------------------------------------------------
- Twilio
- Unifonic
- SMSA
- أي مزود محلي
=====================================================
*/

export const sendSMS = async ({
  to,
  message,
}) => {
  console.log("SMS SENT:", {
    to,
    message,
  });

  return {
    success: true,
    provider: "mock",
  };
};