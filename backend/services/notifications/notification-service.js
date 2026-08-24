import Notification from "../../models/notification-model.js";
import User from "../../models/user-model.js";
import Booking from "../../models/booking/booking-model.js";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPES,
} from "../../constants/notifications/notification-constants.js";
import { sendEmail } from "./email-service.js";
import { sendSMS } from "./sms-service.js";
import { sendWhatsApp } from "./whatsapp-service.js";

const normalizeDeduplicationKey = (value) => {
  const key = String(value || "").trim();
  return key || null;
};

export const createNotificationServiceLayer = ({
  NotificationModel = Notification,
  emailAdapter = sendEmail,
  smsAdapter = sendSMS,
  whatsappAdapter = sendWhatsApp,
  UserModel = User,
  BookingModel = Booking,
  now = () => new Date(),
} = {}) => {
  const resolveNotificationRecipient = async (notification) => {
    const userId = notification.user?._id || notification.user;
    const bookingId = notification.booking?._id || notification.booking;
    const user = userId ? await UserModel.findById(userId) : null;
    const booking = bookingId ? await BookingModel.findById(bookingId) : null;
    return {
      email: user?.email || booking?.customer?.email || "",
      phone: user?.phone || booking?.customer?.phone || "",
      whatsapp: user?.whatsapp || user?.phone || booking?.customer?.whatsapp || booking?.customer?.phone || "",
    };
  };

  const deliverExternalNotification = async ({ notification, recipient }) => {
    if (notification.channel === NOTIFICATION_CHANNELS.EMAIL) {
      await emailAdapter({ to: recipient.email, subject: notification.titleAr || notification.titleEn, text: notification.messageAr || notification.messageEn });
    } else if (notification.channel === NOTIFICATION_CHANNELS.SMS) {
      await smsAdapter({ to: recipient.phone, message: notification.messageAr || notification.messageEn });
    } else if (notification.channel === NOTIFICATION_CHANNELS.WHATSAPP) {
      await whatsappAdapter({ to: recipient.whatsapp || recipient.phone, message: notification.messageAr || notification.messageEn });
    }
  };
  const createRecord = async ({
    user,
    booking,
    titleAr = "",
    titleEn = "",
    messageAr,
    messageEn,
    channel = NOTIFICATION_CHANNELS.DATABASE,
    type = NOTIFICATION_TYPES.GENERAL,
    metadata = {},
    createdBy,
    deduplicationKey = null,
  }) => {
    const normalizedKey = normalizeDeduplicationKey(deduplicationKey);
    const payload = {
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
      deduplicationKey: normalizedKey,
      status:
        channel === NOTIFICATION_CHANNELS.DATABASE
          ? NOTIFICATION_STATUS.SENT
          : NOTIFICATION_STATUS.PENDING,
      sentAt:
        channel === NOTIFICATION_CHANNELS.DATABASE
          ? now()
          : undefined,
    };

    try {
      return {
        notification: await NotificationModel.create(payload),
        created: true,
      };
    } catch (error) {
      if (error?.code !== 11000 || !normalizedKey) throw error;
      const existing = await NotificationModel.findOne({
        deduplicationKey: normalizedKey,
      });
      if (!existing) throw error;
      return { notification: existing, created: false };
    }
  };

  const createNotification = async (input) =>
    (await createRecord(input)).notification;

  const sendNotification = async (input) => {
    const channel = input.channel || NOTIFICATION_CHANNELS.DATABASE;
    const { notification, created } = await createRecord({ ...input, channel });

    // Deduplication also prevents sending an external channel twice.
    if (!created || channel === NOTIFICATION_CHANNELS.DATABASE) {
      return notification;
    }

    try {
      if (channel === NOTIFICATION_CHANNELS.EMAIL) {
        const useArabic = input.language !== "en";
        await emailAdapter({
          to: input.recipient?.email,
          subject: useArabic
            ? input.titleAr || input.titleEn
            : input.titleEn || input.titleAr,
          text: useArabic
            ? input.messageAr || input.messageEn
            : input.messageEn || input.messageAr,
        });
      } else if (channel === NOTIFICATION_CHANNELS.SMS) {
        await smsAdapter({
          to: input.recipient?.phone,
          message: input.messageAr || input.messageEn,
        });
      } else if (channel === NOTIFICATION_CHANNELS.WHATSAPP) {
        await whatsappAdapter({
          to: input.recipient?.whatsapp || input.recipient?.phone,
          message: input.messageAr || input.messageEn,
        });
      }

      notification.status = NOTIFICATION_STATUS.SENT;
      notification.sentAt = now();
      await notification.save();
    } catch (error) {
      notification.status = NOTIFICATION_STATUS.FAILED;
      notification.failedReason = String(error?.message || "Notification delivery failed");
      await notification.save();
    }

    return notification;
  };

  const markNotificationAsRead = async ({ notification }) => {
    notification.isRead = true;
    notification.readAt = now();
    await notification.save();
    return notification;
  };

  const getUnreadCount = ({ userId }) => NotificationModel.countDocuments({
    user: userId,
    channel: NOTIFICATION_CHANNELS.DATABASE,
    isRead: false,
    isDeleted: false,
  });

  const markAllNotificationsAsRead = async ({ userId }) => {
    const readAt = now();
    const result = await NotificationModel.updateMany(
      { user: userId, channel: NOTIFICATION_CHANNELS.DATABASE, isRead: false, isDeleted: false },
      { $set: { isRead: true, readAt } },
    );
    return { modifiedCount: result.modifiedCount || 0, readAt };
  };

  const retryNotification = async ({ notificationId }) => {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, status: NOTIFICATION_STATUS.FAILED, isDeleted: false, channel: { $ne: NOTIFICATION_CHANNELS.DATABASE } },
      { $set: { status: NOTIFICATION_STATUS.PENDING }, $unset: { failedReason: 1 } },
      { new: true },
    );
    if (!notification) {
      const error = new Error("Only failed external notifications can be retried");
      error.code = "NOTIFICATION_NOT_RETRYABLE";
      throw error;
    }
    try {
      const recipient = await resolveNotificationRecipient(notification);
      await deliverExternalNotification({ notification, recipient });
      notification.status = NOTIFICATION_STATUS.SENT;
      notification.sentAt = now();
      notification.failedReason = "";
    } catch (error) {
      notification.status = NOTIFICATION_STATUS.FAILED;
      notification.failedReason = String(error?.message || "Notification delivery failed");
    }
    await notification.save();
    return notification;
  };

  return {
    createNotification,
    sendNotification,
    markNotificationAsRead,
    getUnreadCount,
    markAllNotificationsAsRead,
    retryNotification,
  };
};

const notificationServices = createNotificationServiceLayer();

export const createNotification = notificationServices.createNotification;
export const sendNotification = notificationServices.sendNotification;
export const markNotificationAsRead = notificationServices.markNotificationAsRead;
export const getUnreadCount = notificationServices.getUnreadCount;
export const markAllNotificationsAsRead = notificationServices.markAllNotificationsAsRead;
export const retryNotificationService = notificationServices.retryNotification;
