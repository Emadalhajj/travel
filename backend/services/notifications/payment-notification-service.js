import User from "../../models/user-model.js";
import { NOTIFICATION_TYPES } from "../../constants/notifications/notification-constants.js";
import { sendNotificationChannels } from "./notification-channel-service.js";

const transactionUser = (transaction) => transaction?.user?._id || transaction?.user || null;
const bookingId = (booking, transaction) => booking?._id || transaction?.booking?._id || transaction?.booking || null;
const bookingLabel = (booking, transaction) =>
  booking?.bookingNumber || transaction?.booking?.bookingNumber || transaction?.paymentReference || transaction?._id;

const resolveEmail = async ({ transaction, booking, recipientEmail }) => {
  const directEmail =
    recipientEmail || booking?.customer?.email || transaction?.user?.email || "";
  if (directEmail) return String(directEmail).trim();

  const userId = transactionUser(transaction);
  if (!userId) return "";
  try {
    const user = await User.findById(userId).select("email").lean();
    return String(user?.email || "").trim();
  } catch {
    return "";
  }
};

const sendPaymentEvent = async ({
  transaction,
  booking = null,
  event,
  type,
  titleAr,
  titleEn,
  messageAr,
  messageEn,
  metadata = {},
  req = null,
  recipientEmail = "",
}) => {
  const email = await resolveEmail({ transaction, booking, recipientEmail });
  return sendNotificationChannels({
    payload: {
      user: transactionUser(transaction),
      booking: bookingId(booking, transaction),
      titleAr,
      titleEn,
      messageAr,
      messageEn,
      type,
      metadata: {
        paymentTransactionId: transaction._id,
        paymentReference: transaction.paymentReference || "",
        amount: transaction.amount,
        currency: transaction.currency || "SAR",
        ...metadata,
      },
      createdBy: req?.user?._id,
    },
    deduplicationBase: `payment:${transaction._id}:${event}`,
    email,
    req,
  });
};

export const sendPaymentReceivedNotification = async ({ transaction, booking, req = null }) => {
  const label = bookingLabel(booking, transaction);
  return sendPaymentEvent({
    transaction,
    booking,
    event: "received",
    type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    titleAr: "تم استلام الدفعة",
    titleEn: "Payment Received",
    messageAr: `تم استلام دفعتك بنجاح وإكمال الحجز ${label}.`,
    messageEn: `Your payment was received and booking ${label} was completed successfully.`,
    req,
  });
};

export const sendPaymentFailedNotification = async ({ transaction, recipientEmail = "", req = null }) =>
  sendPaymentEvent({
    transaction,
    event: "failed",
    type: NOTIFICATION_TYPES.PAYMENT_FAILED,
    titleAr: "تعذر إتمام الدفع",
    titleEn: "Payment Failed",
    messageAr: "تعذر إتمام عملية الدفع. يمكنك المحاولة مرة أخرى.",
    messageEn: "The payment could not be completed. You can try again.",
    recipientEmail,
    req,
  });

export const sendPaidPendingBookingNotification = async ({ transaction, req = null }) =>
  sendPaymentEvent({
    transaction,
    event: "paid_pending_booking",
    type: NOTIFICATION_TYPES.PAID_PENDING_BOOKING,
    titleAr: "جارٍ استكمال الحجز",
    titleEn: "Booking Is Being Completed",
    messageAr: "تم استلام الدفع وجارٍ استكمال حجزك. لا تحتاج إلى إعادة الدفع.",
    messageEn: "Your payment was received and your booking is being completed. You do not need to pay again.",
    req,
  });

export const sendBankTransferSubmittedNotification = async ({ transaction, req = null }) =>
  sendPaymentEvent({
    transaction,
    event: "bank_transfer_submitted",
    type: NOTIFICATION_TYPES.BANK_TRANSFER_SUBMITTED,
    titleAr: "تم استلام إثبات التحويل",
    titleEn: "Bank Transfer Proof Received",
    messageAr: "تم استلام إثبات التحويل البنكي وسيتم مراجعته.",
    messageEn: "Your bank transfer proof was received and will be reviewed.",
    req,
  });

export const sendBankTransferApprovedNotification = async ({ transaction, booking, req = null }) =>
  sendPaymentEvent({
    transaction,
    booking,
    event: "bank_transfer_approved",
    type: NOTIFICATION_TYPES.BANK_TRANSFER_APPROVED,
    titleAr: "تم اعتماد التحويل البنكي",
    titleEn: "Bank Transfer Approved",
    messageAr: `تم اعتماد التحويل البنكي وإكمال الحجز ${bookingLabel(booking, transaction)}.`,
    messageEn: `Your bank transfer was approved and booking ${bookingLabel(booking, transaction)} was completed.`,
    req,
  });

export const sendBankTransferRejectedNotification = async ({ transaction, req = null }) =>
  sendPaymentEvent({
    transaction,
    event: "bank_transfer_rejected",
    type: NOTIFICATION_TYPES.BANK_TRANSFER_REJECTED,
    titleAr: "تم رفض التحويل البنكي",
    titleEn: "Bank Transfer Rejected",
    messageAr: "تعذر اعتماد التحويل البنكي. يرجى مراجعة بيانات التحويل والمحاولة مرة أخرى.",
    messageEn: "The bank transfer could not be approved. Please review the transfer details and try again.",
    metadata: { rejectionReason: transaction.rejectionReason || "" },
    req,
  });
