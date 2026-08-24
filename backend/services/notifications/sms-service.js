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
  void to;
  void message;

  return {
    success: true,
    provider: "mock",
  };
};
