// services/notifications/notification-service.js

/*
=====================================================
Notification Service
=====================================================

هذا هو الملف المركزي للإشعارات.

المسؤوليات:
-----------------------------------------------------
1- إنشاء إشعار داخل قاعدة البيانات.
2- إرسال الإشعار حسب القناة.
3- تحديث حالة الإشعار sent / failed.
4- دعم database/email/sms/whatsapp.
=====================================================
*/

import { sendEmail } from "./email-service.js";
import { sendSMS } from "./sms-service.js";
import { sendWhatsApp } from "./whatsapp-service.js";

/*
=====================================================
Create Notification
=====================================================
*/

export const createNotification = async ({
  Notification,
  user,
  booking,
  titleAr = "",
  titleEn = "",
  messageAr,
  messageEn,
  channel = "database",
  type = "general",
  metadata = {},
  createdBy,
}) => {
  return await Notification.create({
    user,
    booking,
    titleAr,
    titleEn,
    messageAr,
    messageEn,
    channel,
    type,
    metadata,
    createdBy,
    status: channel === "database" ? "sent" : "pending",
    sentAt: channel === "database" ? new Date() : undefined,
  });
};

/*
=====================================================
Send Notification
=====================================================

هذه الدالة ترسل الإشعار حسب القناة.

إذا كانت القناة database:
-----------------------------------------------------
يتم حفظه فقط في قاعدة البيانات.

إذا كانت email/sms/whatsapp:
-----------------------------------------------------
يتم حفظه ثم محاولة الإرسال.
*/

export const sendNotification = async ({
  Notification,
  user,
  booking,
  titleAr = "",
  titleEn = "",
  messageAr,
  messageEn,
  channel = "database",
  type = "general",
  metadata = {},
  recipient = {},
  createdBy,
}) => {
  const notification = await createNotification({
    Notification,
    user,
    booking,
    titleAr,
    titleEn,
    messageAr,
    messageEn,
    channel,
    type,
    metadata,
    createdBy,
  });

  try {
    if (channel === "database") {
      return notification;
    }

    if (channel === "email") {
      await sendEmail({
        to: recipient.email,
        subject: titleEn || titleAr,
        html: messageEn || messageAr,
        text: messageEn || messageAr,
      });
    }

    if (channel === "sms") {
      await sendSMS({
        to: recipient.phone,
        message: messageAr || messageEn,
      });
    }

    if (channel === "whatsapp") {
      await sendWhatsApp({
        to: recipient.whatsapp || recipient.phone,
        message: messageAr || messageEn,
      });
    }

    notification.status = "sent";
    notification.sentAt = new Date();
    await notification.save();

    return notification;
  } catch (error) {
    notification.status = "failed";
    notification.failedReason = error.message;
    await notification.save();

    return notification;
  }
};

/*
=====================================================
Mark As Read
=====================================================
*/

export const markNotificationAsRead = async ({
  notification,
}) => {
  notification.isRead = true;
  notification.readAt = new Date();

  await notification.save();

  return notification;
};