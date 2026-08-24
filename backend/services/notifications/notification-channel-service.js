import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import { NOTIFICATION_CHANNELS } from "../../constants/notifications/notification-constants.js";
import { sendNotification } from "./notification-service.js";

export const sendNotificationChannels = async ({
  payload,
  deduplicationBase,
  email = "",
  req = null,
}) => {
  const language = req && !isArabicRequest(req) ? "en" : "ar";
  const requests = [
    {
      name: NOTIFICATION_CHANNELS.DATABASE,
      promise: sendNotification({
        ...payload,
        channel: NOTIFICATION_CHANNELS.DATABASE,
        deduplicationKey: `${deduplicationBase}:database`,
      }),
    },
    {
      name: NOTIFICATION_CHANNELS.EMAIL,
      promise: sendNotification({
        ...payload,
        channel: NOTIFICATION_CHANNELS.EMAIL,
        recipient: { email },
        language,
        deduplicationKey: `${deduplicationBase}:email`,
      }),
    },
  ];
  const settled = await Promise.allSettled(requests.map(({ promise }) => promise));

  return Object.fromEntries(
    settled.map((result, index) => [
      requests[index].name,
      result.status === "fulfilled" ? result.value : null,
    ]),
  );
};
