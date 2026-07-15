// services/notifications/email-service.js

/*
=====================================================
Email Service
=====================================================

هذا الملف مسؤول عن إرسال البريد الإلكتروني.

حالياً الكود placeholder حتى لا نربطه بمزود فعلي الآن.

لاحقاً يمكن ربطه مع:
-----------------------------------------------------
- Nodemailer
- SendGrid
- Mailgun
- Amazon SES
=====================================================
*/

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}) => {
  /*
  ملاحظة:
  -----------------------------------------------------
  هنا لاحقاً تضع إعدادات nodemailer أو أي مزود بريد.

  حالياً نعيد success حتى لا يتعطل النظام.
  */

  console.log("EMAIL SENT:", {
    to,
    subject,
    html,
    text,
  });

  return {
    success: true,
    provider: "mock",
  };
};