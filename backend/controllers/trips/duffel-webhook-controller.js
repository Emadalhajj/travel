import { handleDuffelWebhookEvent, parseVerifiedDuffelWebhook } from
  "../../services/trips/duffel-webhook-service.js";
import { recoverPaidPendingBookingsService } from
  "../../services/payment/payment-recovery-service.js";

export const handleDuffelWebhook = async (req, res, next) => {
  try {
    const event = parseVerifiedDuffelWebhook({
      rawBody: req.body,
      signature: req.get("X-Duffel-Signature"),
    });
    const result = await handleDuffelWebhookEvent({ event });
    res.status(200).json({ success: true, received: true });
    if (result.confirmed) {
      setImmediate(() => {
        recoverPaidPendingBookingsService({ limit: 10 }).catch((error) => {
          console.error("External flight recovery trigger failed:", error?.message || error);
        });
      });
    }
  } catch (error) {
    next(error);
  }
};
